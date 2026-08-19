package mz.com.sgp.services;

import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import mz.com.sgp.model.ClientEntity;
import mz.com.sgp.model.ClientType;
import mz.com.sgp.model.ConsumptionEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.repository.ClientRepository;
import mz.com.sgp.repository.ConsumptionRepository;
import mz.com.sgp.repository.FileImportRepository;

@Service
public class ImportServices {

    @Autowired
    private GoogleDriveService googleDriveService;

    @Autowired
    private FileImportRepository fileImportRepository;

    @Autowired
    private ConsumptionRepository consumptionRepository;

    @Autowired
    private ClientRepository clientRepository;

    private static final DataFormatter DATA_FORMATTER = new DataFormatter();

    private static final Pattern STRICT_FILE_NAME_PATTERN = 
            Pattern.compile("^Hlog\\s*-\\s*(.+?)\\s*-\\s*(\\d{4})\\s+(\\d{2})\\.(csv|xls|xlsx|xlsm)$", Pattern.CASE_INSENSITIVE);

    private static final DateTimeFormatter FLEXIBLE_DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("[yyyy-MM-dd'T'HH:mm:ss][yyyy-MM-dd'T'HH:mm][yyyy-MM-dd HH:mm:ss][yyyy-MM-dd HH:mm][dd/MM/yyyy HH:mm:ss][dd/MM/yyyy HH:mm][MM/dd/yyyy HH:mm:ss][MM/dd/yyyy HH:mm][M/d/yyyy h:mm:ss a][M/d/yyyy h:mm a][dd.MM.yyyy HH:mm:ss][dd.MM.yyyy HH:mm][yyyy/MM/dd HH:mm:ss][yyyy/MM/dd HH:mm]")
            .toFormatter(Locale.ENGLISH);

    private static final DateTimeFormatter FLEXIBLE_DATE_FORMATTER = DateTimeFormatter.ofPattern("[yyyy-MM-dd][dd/MM/yyyy][MM/dd/yyyy][M/d/yyyy][dd.MM.yyyy][yyyy/MM/dd]");
    
    private static final DateTimeFormatter TIME_FORMATTER = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("[hh:mm:ss a][h:mm:ss a][hh:mm a][h:mm a][HH:mm:ss][HH:mm][H:mm:ss][H:mm]")
            .toFormatter(Locale.ENGLISH);
    
    private static final List<String> INVALID_NAMING_FILES = Collections.synchronizedList(new ArrayList<>());

    public static List<String> getAndClearInvalidNamingFiles() {
        List<String> copy = new ArrayList<>(INVALID_NAMING_FILES);
        INVALID_NAMING_FILES.clear(); 
        return copy;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processDriveFile(String fileId, String fileName) {

        if (fileImportRepository.existsByFileName(fileName)) {
            System.out.println("⚠️ Ficheiro '" + fileName + "' já foi importado anteriormente.");
            return;
        }

        String cleanFileName = fileName.trim();
        String extension = cleanFileName.substring(cleanFileName.lastIndexOf('.') + 1).toLowerCase();
        

        Matcher matcher = STRICT_FILE_NAME_PATTERN.matcher(cleanFileName);
        
//        if (!matcher.matches()) {
//            throw new IllegalArgumentException(
//                "Nome do ficheiro inválido: '" + cleanFileName + 
//                "'. O padrão esperado é 'Hlog - NomeCliente - AAAA MM.ext' (ex: 'Hlog - Parmalat - 2026 06.csv')."
//            );
//        }
        
        if (!matcher.matches()) {
            System.err.println(
                    "Nome do ficheiro inválido: '" + cleanFileName + 
                    "'. O padrão esperado é 'Hlog - NomeCliente - AAAA MM.ext' (ex: 'Hlog - Parmalat - 2026 06.csv')."
                );
            INVALID_NAMING_FILES.add(cleanFileName); 
            
            return; 
        }

        String clientName = matcher.group(1).trim();
        int downloadYear = Integer.parseInt(matcher.group(2));
        int downloadMonth = Integer.parseInt(matcher.group(3));
        
        if (downloadMonth < 1 || downloadMonth > 12) {
            throw new IllegalArgumentException("Mês inválido no nome do ficheiro: " + downloadMonth);
        }

        LocalDateTime fileDownloadDate = LocalDate.of(downloadYear, downloadMonth, 1).atStartOfDay();

        ClientEntity client = findOrCreateClient(clientName);

        FileImportEntity fileImport = new FileImportEntity();
        fileImport.setFileName(cleanFileName);
        fileImport.setFileDate(fileDownloadDate);
        fileImport.setImportDate(LocalDateTime.now());
        fileImport.setClient(client);
        fileImport.setClientId(client.getId());
        fileImport = fileImportRepository.saveAndFlush(fileImport);

        try (InputStream inputStream = googleDriveService.getFileInputStream(fileId)) {
            List<ConsumptionEntity> consumptionsToSave;

            if ("csv".equals(extension)) {
                consumptionsToSave = parseCsvAdaptive(inputStream, fileImport, client);
            } else {
                consumptionsToSave = parseExcelAdaptive(inputStream, fileImport, client);
            }

            if (!consumptionsToSave.isEmpty()) {
                consumptionRepository.saveAll(consumptionsToSave);
            }
            System.out.println("✅ Importação concluída! " + consumptionsToSave.size() + " registos inseridos (" + cleanFileName + ")");

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar ficheiro " + cleanFileName + ": " + e.getMessage(), e);
        }
    }

    private List<ConsumptionEntity> parseCsvAdaptive(InputStream inputStream, FileImportEntity fileImport, ClientEntity client) {
        List<ConsumptionEntity> list = new ArrayList<>();
        try {
            byte[] bytes = inputStream.readAllBytes();
            Charset charset = detectCharset(bytes);

            String content = new String(bytes, charset)
                    .replace("\u0000", "")
                    .replace("\uFEFF", "")
                    .replace("\uA600", "");

            String[] lines = content.split("\\r?\\n");

            Map<String, Integer> headerMap = null;
            String delimiter = null;

            for (String rawLine : lines) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.equalsIgnoreCase("sep=") || line.toLowerCase().startsWith("sep=")) {
                    continue;
                }

                String currentDelimiter = detectDelimiter(line);
                String[] cols = line.split(currentDelimiter, -1);
                for (int i = 0; i < cols.length; i++) {
                    cols[i] = cols[i].trim().replaceAll("^\"|\"$", "");
                }

                if (headerMap == null) {
                    if (isHeaderRow(cols)) {
                        headerMap = buildHeaderMap(cols);
                        delimiter = currentDelimiter;
                    }
                    continue;
                }

                if (isUnitsRow(cols)) {
                    continue;
                }

                ConsumptionEntity c = parseRowWithMap(cols, headerMap, fileImport, client);
                if (c != null) {
                    list.add(c);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro na leitura do CSV: " + e.getMessage(), e);
        }
        return list;
    }

    private List<ConsumptionEntity> parseExcelAdaptive(InputStream inputStream, FileImportEntity fileImport, ClientEntity client) {
        List<ConsumptionEntity> list = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            for (int sheetIdx = 0; sheetIdx < workbook.getNumberOfSheets(); sheetIdx++) {
                Sheet sheet = workbook.getSheetAt(sheetIdx);
                Map<String, Integer> headerMap = null;

                for (Row row : sheet) {
                    if (row == null) continue;

                    List<String> cellValues = new ArrayList<>();
                    int lastCellNum = Math.max(row.getLastCellNum(), 0);
                    for (int i = 0; i < lastCellNum; i++) {
                        cellValues.add(getCellValueAsString(row.getCell(i)));
                    }

                    String rowText = String.join(" ", cellValues).trim();
                    if (rowText.isEmpty()) continue;

                    String[] cols = cellValues.toArray(new String[0]);

                    if (headerMap == null) {
                        if (isHeaderRow(cols)) {
                            headerMap = buildHeaderMap(cols);
                        }
                        continue;
                    }

                    if (isUnitsRow(cols)) {
                        continue;
                    }

                    ConsumptionEntity c = parseRowWithMap(cols, headerMap, fileImport, client);
                    if (c != null) {
                        list.add(c);
                    }
                }

                if (!list.isEmpty()) {
                    break;
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro na leitura do Excel: " + e.getMessage(), e);
        }
        return list;
    }

    private boolean isHeaderRow(String[] cols) {
        String fullLine = cleanHeaderName(String.join(" ", cols));

        boolean hasDate = fullLine.contains("date") || fullLine.contains("time") 
                       || fullLine.contains("data") || fullLine.contains("tempo")
                       || fullLine.contains("timestamp") || fullLine.contains("hora")
                       || fullLine.contains("dt") || fullLine.contains("tm");
                       
        boolean hasVolumeCol = fullLine.contains("baaa") || fullLine.contains("data6") || fullLine.contains("vb") 
                            || fullLine.contains("corvol") || fullLine.contains("vol") 
                            || fullLine.contains("vbase") || fullLine.contains("volume")
                            || fullLine.contains("vcor") || fullLine.contains("vbm")
                            || fullLine.contains("vm") || fullLine.contains("uncorrected");

        return hasDate && hasVolumeCol;
    }

    private boolean isUnitsRow(String[] cols) {
        String line = String.join(" ", cols).toLowerCase();
        return line.contains("m3") || line.contains("m³") || line.contains("bar") 
            || line.contains("°c") || line.contains("nm3/h") || line.contains("nm³/h") 
            || line.contains("m3/h") || line.contains("kpa");
    }

    private Map<String, Integer> buildHeaderMap(String[] headers) {
        Map<String, Integer> map = new HashMap<>();

        Integer dateTimeIdx = null;
        Integer dateIdx = null;
        Integer timeIdx = null;
        Integer corrVolIdx = null;

        for (int i = 0; i < headers.length; i++) {
            String h = cleanHeaderName(headers[i]);

            if (dateTimeIdx == null && (h.equals("datetime") || h.equals("timestamp") || h.contains("datahora") || h.contains("dateandtime"))) {
                dateTimeIdx = i;
            } else if (dateIdx == null && (h.equals("date") || h.equals("logdate") || h.equals("data"))) {
                dateIdx = i;
            } else if (timeIdx == null && (h.equals("time") || h.equals("hora") || h.equals("logtime"))) {
                timeIdx = i;
            }
        }

        if (dateTimeIdx == null && dateIdx == null && timeIdx != null) {
            dateTimeIdx = timeIdx;
            timeIdx = null;
        }

        if (dateTimeIdx != null) map.put("dateTime", dateTimeIdx);
        if (dateIdx != null) map.put("date", dateIdx);
        if (timeIdx != null) map.put("time", timeIdx);

        List<String> targetAliases = Arrays.asList(
                "vb", "vbm3", "baaa", "vbm", "corvol", "volcorrigido","data6", 
                "correctedvolume", "vol", "volume", "vbase", "volbase", "vcorrigido", "vcor", "vm"
        );

        for (int i = 0; i < headers.length; i++) {
            String rawHeader = headers[i];
            String hClean = cleanHeaderName(rawHeader);

            if (hClean.contains("delta") || rawHeader.contains("Δ") || hClean.startsWith("dvb") || hClean.contains("error") || hClean.contains("alarm")) {
                continue;
            }

            for (String target : targetAliases) {
                if (hClean.equals(target) || hClean.startsWith(target)) {
                    corrVolIdx = i;
                    break;
                }
            }

            if (corrVolIdx != null) break;
        }

        if (corrVolIdx != null) {
            map.put("corrVol", corrVolIdx);
        }

        return map;
    }

    private String cleanHeaderName(String header) {
        if (header == null) return "";
        return header.replace("\uFEFF", "")
                     .replace("\u0000", "")
                     .replaceAll("[³³]", "3")
                     .replaceAll("[^a-zA-Z0-9]", "")
                     .toLowerCase()
                     .trim();
    }

    private ConsumptionEntity parseRowWithMap(String[] cols, Map<String, Integer> headerMap, FileImportEntity fileImport, ClientEntity client) {
        String dateTimeVal = getValueFromCol(cols, headerMap.get("dateTime"));
        String dateVal = getValueFromCol(cols, headerMap.get("date"));
        String timeVal = getValueFromCol(cols, headerMap.get("time"));
        String volVal = getValueFromCol(cols, headerMap.get("corrVol"));

        String primaryDateStr = !dateTimeVal.isEmpty() ? dateTimeVal : dateVal;
        if (primaryDateStr.isEmpty() && !timeVal.isEmpty()) {
            primaryDateStr = timeVal;
            timeVal = "";
        }

        if (primaryDateStr.isEmpty() || volVal.isEmpty()) return null;

        return buildConsumption(primaryDateStr, timeVal, volVal, fileImport, client);
    }

    private ConsumptionEntity buildConsumption(String dateStr, String timeStr, String volStr, FileImportEntity fileImport, ClientEntity client) {
        try {
            LocalDateTime logDateTime = parseDateTime(dateStr, timeStr);
            if (logDateTime == null) return null;

            BigDecimal volume = parseToBigDecimal(volStr);

            ConsumptionEntity c = new ConsumptionEntity();
            c.setFileImport(fileImport);
            c.setFileImportId(fileImport.getId());
            c.setClient(client);
            c.setClientId(client.getId());
            c.setConsumptionDate(logDateTime);
            c.setCorrectedVolume(volume);

            return c;
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String dateStr, String timeStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return null;
        dateStr = dateStr.trim();
        if (timeStr != null) timeStr = timeStr.trim();

        try {
            return LocalDateTime.parse(dateStr, FLEXIBLE_DATE_TIME_FORMATTER);
        } catch (Exception ignored) {}

        if (dateStr.contains("T")) {
            try { return LocalDateTime.parse(dateStr.replace("Z", "")); } catch (Exception ignored) {}
        }

        if (dateStr.contains(" ")) {
            String[] parts = dateStr.split("\\s+");
            dateStr = parts[0];
            if ((timeStr == null || timeStr.isEmpty()) && parts.length > 1) {
                timeStr = parts[1];
            }
        }

        try {
            LocalDate date = LocalDate.parse(dateStr, FLEXIBLE_DATE_FORMATTER);
            LocalTime time = (timeStr == null || timeStr.isEmpty()) ? LocalTime.MIDNIGHT : LocalTime.parse(timeStr, TIME_FORMATTER);
            return LocalDateTime.of(date, time);
        } catch (Exception e) {

        	try {
                String[] dParts = dateStr.split("[/-]");
                if (dParts.length == 3) {
                    int m = Integer.parseInt(dParts[0]);
                    int d = Integer.parseInt(dParts[1]);
                    int y = Integer.parseInt(dParts[2]);
                    LocalDate date = LocalDate.of(y, m, d);
                    LocalTime time = (timeStr == null || timeStr.isEmpty()) ? LocalTime.MIDNIGHT : LocalTime.parse(timeStr, TIME_FORMATTER);
                    return LocalDateTime.of(date, time);
                }
            } catch (Exception ignored) {}
            return null;
        }
    }

    private String detectDelimiter(String line) {
        long semicolons = line.chars().filter(ch -> ch == ';').count();
        long commas = line.chars().filter(ch -> ch == ',').count();
        long tabs = line.chars().filter(ch -> ch == '\t').count();

        if (semicolons >= commas && semicolons >= tabs && semicolons > 0) return ";";
        if (commas >= semicolons && commas >= tabs && commas > 0) return ",";
        if (tabs > 0) return "\t";
        return ",";
    }

    private String getValueFromCol(String[] cols, Integer index) {
        if (index == null || index < 0 || index >= cols.length) return "";
        return cols[index].trim();
    }

    private BigDecimal parseToBigDecimal(String value) {
        if (value == null || value.trim().isEmpty() || "-".equals(value.trim())) {
            return BigDecimal.ZERO;
        }
        String cleanValue = value.trim()
                .replace("\u00A0", "")
                .replaceAll("[^0-9.,-]", "");
                
        if (cleanValue.contains(",") && !cleanValue.contains(".")) {
            cleanValue = cleanValue.replace(",", ".");
        } else if (cleanValue.contains(",") && cleanValue.contains(".")) {
            cleanValue = cleanValue.replace(".", "").replace(",", ".");
        }
        return new BigDecimal(cleanValue);
    }

    private Charset detectCharset(byte[] bytes) {
        if (bytes.length >= 2) {
            if ((bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xFE) || (bytes[0] == (byte) 0xFE && bytes[1] == (byte) 0xFF)) {
                return StandardCharsets.UTF_16;
            }
            if (bytes[1] == 0x00 || bytes[0] == 0x00) {
                return StandardCharsets.UTF_16;
            }
        }
        return StandardCharsets.UTF_8;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().toString();
        }
        return DATA_FORMATTER.formatCellValue(cell).trim();
    }

//    private String extractClientNameFromFileName(String fileName) {
//        String baseName = fileName.replaceAll("(?i)\\.(csv|xls|xlsx|xlsm)$", "");
//        baseName = baseName.replaceAll("(?i)^Hlog[_-]?", "").trim();
//        baseName = baseName.replaceAll("[_-]?\\d+$", "").trim();
//        baseName = baseName.replaceAll("\\d{2}[.-]\\d{2}[.-]\\d{4}", "").trim();
//        return baseName.isEmpty() ? "DESCONHECIDO" : baseName;
//    }

    private ClientEntity findOrCreateClient(String firstName) {
        return clientRepository.findFirstByFirstNameIgnoreCase(firstName)
                .orElseGet(() -> {
                    ClientEntity newClient = new ClientEntity();
                    newClient.setFirstName(firstName);
                    newClient.setType(ClientType.COMPANY);
                    return clientRepository.saveAndFlush(newClient);
                });
    }
}