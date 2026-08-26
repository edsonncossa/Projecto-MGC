package mz.com.sgp.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mz.com.sgp.services.CertificateServices;

@RestController
@RequestMapping("/api/certificados")
@CrossOrigin(origins = "*")
public class CertificateController {

    @Autowired
    private CertificateServices CertificateServices;

    @GetMapping("/emitir-pdf")
    public ResponseEntity<byte[]> emitirCertificado(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) String viewMode,
            @RequestParam(required = false) Integer selectedMonth,
            @RequestParam(required = false) Integer selectedYear,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Double energyContentMjSm3) {

        try {
            byte[] pdfBytes = CertificateServices.gerarCertificadoPdfEmMemoria(
                    clientId, viewMode, selectedMonth, selectedYear, startDate, endDate, energyContentMjSm3
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            // 'inline' permite visualizar no navegador sem forçar download imediato
            headers.setContentDispositionFormData("inline", "Certificado_Consumo.pdf");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}