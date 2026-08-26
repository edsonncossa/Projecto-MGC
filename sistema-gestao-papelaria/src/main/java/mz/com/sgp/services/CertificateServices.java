package mz.com.sgp.services;


import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.util.JRLoader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Service
public class CertificateServices {

    @Autowired
    private DataSource dataSource;

    /**
     * Gera o certificado diretamente em memória como um array de bytes PDF.
     * Não persiste nenhuma informação em tabelas do banco de dados.
     */
    public byte[] gerarCertificadoPdfEmMemoria(
            Long clientId, 
            String viewMode, 
            Integer selectedMonth, 
            Integer selectedYear, 
            String startDate, 
            String endDate, 
            Double energyContentMjSm3) throws Exception {

        // 1. Carregar o template do relatório
        InputStream jasperStream = getClass().getResourceAsStream("/reports/CertificadoConsumo.jasper");
        
        JasperReport jasperReport;
        if (jasperStream != null) {
            jasperReport = (JasperReport) JRLoader.loadObject(jasperStream);
        } else {
            InputStream jrxmlStream = getClass().getResourceAsStream("/reports/CertificadoConsumo.jrxml");
            if (jrxmlStream == null) {
                throw new RuntimeException("Modelo de relatório não encontrado em src/main/resources/reports/");
            }
            jasperReport = JasperCompileManager.compileReport(jrxmlStream);
        }

        // 2. Mapear os Parâmetros recebidos da tela
        Map<String, Object> params = new HashMap<>();
        params.put("clientId", clientId);
        params.put("viewMode", viewMode);
        params.put("selectedMonth", selectedMonth);
        params.put("selectedYear", selectedYear);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        params.put("energyContentMjSm3", energyContentMjSm3);

        // Carregar o logótipo em memória para injetar no relatório
        InputStream logoStream = getClass().getResourceAsStream("/assets/MGC-Logo.png");
        if (logoStream != null) {
            params.put("LOGO_PATH", logoStream);
        }

        // 3. Preencher o relatório dinamicamente usando a conexão atual
        try (Connection conn = dataSource.getConnection()) {
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, params, conn);
            
            // 4. Retornar os bytes do PDF gerado em memória
            return JasperExportManager.exportReportToPdf(jasperPrint);
        }
    }
}