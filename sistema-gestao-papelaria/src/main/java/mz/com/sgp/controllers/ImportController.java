package mz.com.sgp.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.api.services.drive.model.File;

import mz.com.sgp.services.GoogleDriveService;
import mz.com.sgp.services.ImportServices;

@RestController
@RequestMapping("/api/v1/importacao")
public class ImportController {

    @Autowired
    private GoogleDriveService googleDriveService;

    @Autowired
    private ImportServices importServices;

    @GetMapping("/ficheiros")
    public ResponseEntity<List<File>> listarFicheiros() {
        try {
            List<File> files = googleDriveService.listFilesInFolder();
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/processar")
    public ResponseEntity<String> processarFicheiro(
            @RequestParam String fileId, 
            @RequestParam String fileName) {
        try {
            importServices.processDriveFile(fileId, fileName);
            return ResponseEntity.ok("Ficheiro '" + fileName + "' processado com sucesso!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar o ficheiro: " + e.getMessage());
        }
    }

    @PostMapping("/sincronizar-tudo")
    public ResponseEntity<String> sincronizarTudo() {
        try {
            List<File> files = googleDriveService.listFilesInFolder();
            if (files == null || files.isEmpty()) {
                return ResponseEntity.ok("Nenhum ficheiro encontrado na pasta do Google Drive.");
            }

            int sucessos = 0;
            int falhas = 0;

            for (File file : files) {
                try {
                    importServices.processDriveFile(file.getId(), file.getName());
                    sucessos++;
                } catch (Exception e) {
                    falhas++;
                    System.err.println("❌ Falha no ficheiro " + file.getName() + ": " + e.getMessage());
                }
            }

            return ResponseEntity.ok(String.format("Sincronização concluída! Sucessos: %d | Falhas: %d | Total lido: %d", 
                    sucessos, falhas, files.size()));
                    
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro crítico durante a sincronização: " + e.getMessage());
        }
    }
}