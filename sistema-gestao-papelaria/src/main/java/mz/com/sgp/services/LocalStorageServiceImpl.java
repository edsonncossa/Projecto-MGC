package mz.com.sgp.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;


@Service
@Primary
public class LocalStorageServiceImpl implements StorageService{

	@Value("${app.storage.local-path:/home/edson-cossa/Documentos/Projecto-MGC-GAS-Management/documentos do consumo}")
    private String localPath;
	
	@Override
	public InputStream getFileStream(String fileName) {
		try {
            String fullPath = localPath.endsWith("/") ? localPath + fileName : localPath + "/" + fileName;
            File file = new File(fullPath);
            
            return new FileInputStream(file);
        } catch (FileNotFoundException e) {
            throw new RuntimeException("Ficheiro não encontrado no caminho local: " + fileName, e);
        }
	}

	@Override
    public List<String> listAvailableFiles() {
        List<String> csvFiles = new ArrayList<>();
        File folder = new File(localPath);

        if (!folder.exists()) {
            folder.mkdirs();
        }
        File[] listOfFiles = folder.listFiles();

        if (listOfFiles != null) {
            for (File file : listOfFiles) {
            	if (file.isFile() && (file.getName().toLowerCase().endsWith(".csv") 
                        || file.getName().toLowerCase().endsWith(".xls") 
                        || file.getName().toLowerCase().endsWith(".xlsx"))) {
         csvFiles.add(file.getName());
     }
            }
        }

        return csvFiles;
    }
}
