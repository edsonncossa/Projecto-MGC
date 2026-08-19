package mz.com.sgp.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.controllers.docs.FileImportControllerDocs;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.services.FileImportServices;

@RestController
@RequestMapping("api/FileImport/v1")
@Tag(name = "FileImport", description = "Endpoints for Managing FileImport")
public class FileImportController implements FileImportControllerDocs{
	
	@Autowired
	private FileImportServices FileImportServices;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<FileImportDTO>>> findAll(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "sortField", defaultValue = "name") String sortField,
            @RequestParam(value = "search", required = false) String search
    ) {
		 var sortDirection = "desc".equalsIgnoreCase(direction)
		            ? Sort.Direction.DESC
		            : Sort.Direction.ASC;

		    Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		    return ResponseEntity.ok(FileImportServices.findAll(pageable, search));
    }
	
    @GetMapping(value = "/{id}",
            produces = {
                    MediaType.APPLICATION_JSON_VALUE,
                    MediaType.APPLICATION_XML_VALUE,
                    MediaType.APPLICATION_YAML_VALUE}
    )
	public FileImportDTO findById(@PathVariable("id") Long id) {
		return FileImportServices.findById(id);
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public FileImportDTO create(@RequestBody FileImportDTO FileImport) {
		return FileImportServices.create(FileImport);
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public FileImportDTO update(@RequestBody FileImportDTO FileImport) {
		return FileImportServices.update(FileImport);
	}

    @PatchMapping(value = "/disableClient/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public FileImportDTO disableFileImport(@PathVariable("id") Long id) {
        return FileImportServices.disableFileImport(id);
    }
    
    @GetMapping("/countClients")
    public long countClients() {
        return FileImportServices.countFileImports();
    }

}
