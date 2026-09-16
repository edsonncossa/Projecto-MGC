package mz.com.sgp.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mz.com.sgp.data.dto.CertificateDTO;
import mz.com.sgp.services.CertificateServices;

@RestController
@RequestMapping("/api/certificados")
public class CertificateController {

    private final CertificateServices certificadoServices;

    public CertificateController(CertificateServices certificadoService) {
    	
        this.certificadoServices = certificadoService;
    }

    @PostMapping("/emitir")
    public ResponseEntity<byte[]> emitirCertificado(@RequestBody CertificateDTO dto) {
        try {
            System.out.println(">>> Requisição recebida no backend para emitir certificado do cliente: " + dto.getCustomerName());
            
            byte[] pdfBytes = certificadoServices.gerarCertificadoPdf(dto);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=Gas_Supply_Certificate.pdf");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}