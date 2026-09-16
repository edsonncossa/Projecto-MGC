package mz.com.sgp.services;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import mz.com.sgp.data.dto.CertificateDTO;
import net.sf.jasperreports.engine.JREmptyDataSource;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;

@Service
public class CertificateServices {

    public byte[] gerarCertificadoPdf(CertificateDTO dto) throws Exception {
        InputStream jasperStream = getClass().getResourceAsStream("/jasper/Gas_Supply_Certificate.jrxml");
        
        if (jasperStream == null) {
            throw new IllegalArgumentException("Ficheiro Gas_Supply_Certificate.jrxml não encontrado em resources/jasper/");
        }

        // 1. Compilar o ficheiro .jrxml em memória
        JasperReport jasperReport = JasperCompileManager.compileReport(jasperStream);

        // 2. Mapear os parâmetros
        Map<String, Object> parameters = new HashMap<>();
        parameters.put("CUSTOMER_NAME", dto.getCustomerName());
        parameters.put("MONTH_YEAR", dto.getMonthYear());
        parameters.put("TOTAL_VOLUME_M3", dto.getTotalVolumeM3());
        parameters.put("TOTAL_ENERGY_GJ", dto.getTotalEnergyGj());
        parameters.put("DAILY_AVG_M3", dto.getDailyAvgM3());
        parameters.put("DAILY_AVG_GJ", dto.getDailyAvgGj());
        parameters.put("ENERGY_CONTENT", dto.getEnergyContentMjSm3());

        // 2.1 Carregar os logos a partir de resources/assets (classpath)
        InputStream mgcLogoStream = getClass().getResourceAsStream("/assets/MGC-Logo.png"); 
        if (mgcLogoStream == null) {
            throw new IllegalArgumentException("Ficheiro MGC-Logo.png não encontrado em resources/assets/");
        }
        parameters.put("MGC_LOGO", mgcLogoStream);

        InputStream madeInMozStream = getClass().getResourceAsStream("/assets/Made in Mozambique.png");
        if (madeInMozStream == null) {
            throw new IllegalArgumentException("Ficheiro 'Made in Mozambique.png' não encontrado em resources/assets/");
        }
        parameters.put("MADE_IN_MOZ", madeInMozStream);

        // 3. Preencher o relatório utilizando o jasperReport compilado
        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, new JREmptyDataSource());

        return JasperExportManager.exportReportToPdf(jasperPrint);
    }
}