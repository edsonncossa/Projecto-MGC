package mz.com.sgp.services;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import com.google.api.services.drive.model.File;

@Component
public class DriveScheduler {

    @Autowired
    private GoogleDriveService googleDriveService;

    @Autowired
    private ImportServices importServices;

    @Scheduled(cron = "0 */20 * * * *")
    public void syncDriveFilesTask() {
        System.out.println("🔄 [AGENDAMENTO] A verificar novos ficheiros no Google Drive...");

        try {
            UsernamePasswordAuthenticationToken systemAuth = new UsernamePasswordAuthenticationToken(
                    "SYSTEM_SCHEDULER", null, List.of());
            SecurityContextHolder.getContext().setAuthentication(systemAuth);

            List<File> files = googleDriveService.listFilesInFolder(); 

            if (files == null || files.isEmpty()) {
                System.out.println("ℹ️ [AGENDAMENTO] Nenhum ficheiro encontrado na pasta.");
                return;
            }

            int importados = 0;
            for (File file : files) { 
                try {
                    importServices.processDriveFile(file.getId(), file.getName()); 
                    importados++; 
                } catch (Exception e) {
                    System.err.println("❌ [AGENDAMENTO] Erro ao processar ficheiro " + file.getName() + ": " + e.getMessage()); 
                }
            }

            System.out.println("✅ [AGENDAMENTO] Varredura concluída com sucesso. Ficheiros verificados: " + importados); 

        } catch (Exception e) {
            System.err.println("❌ [AGENDAMENTO] Falha ao consultar o Google Drive: " + e.getMessage()); 
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}