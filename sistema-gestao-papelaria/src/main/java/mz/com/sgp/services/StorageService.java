package mz.com.sgp.services;

import java.io.InputStream;
import java.util.List;

public interface StorageService {
	
	InputStream getFileStream(String fileName);
    

    List<String> listAvailableFiles();

}
