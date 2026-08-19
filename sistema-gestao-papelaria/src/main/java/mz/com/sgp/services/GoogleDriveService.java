package mz.com.sgp.services;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.FileList;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleDriveService {

    @Value("${google.drive.credentials-file}")
    private Resource credentialsResource;

    @Value("${google.drive.folder-id}")
    private String folderId;

    private Drive getDriveClient() throws Exception {
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(credentialsResource.getInputStream())
                .createScoped(Collections.singleton(DriveScopes.DRIVE_READONLY));

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("SGP-Integration")
                .build();
    }

    /**
     * Baixa o conteúdo do ficheiro diretamente como InputStream para ler o CSV/Excel
     */
    public InputStream getFileInputStream(String fileId) throws Exception {
        Drive drive = getDriveClient();
        return drive.files().get(fileId).executeMediaAsInputStream();
    }

    /**
     * Lista todos os ficheiros contidos na pasta configurada
     */
    public List<com.google.api.services.drive.model.File> listFilesInFolder() throws Exception {
        Drive drive = getDriveClient();
        
        // Query para procurar ficheiros dentro da pasta configurada (exclui pastas e itens do lixo)
        String query = String.format("'%s' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false", folderId);

        FileList result = drive.files().list()
                .setQ(query)
                .setFields("files(id, name)")
                .execute();

        return result.getFiles();
    }
}