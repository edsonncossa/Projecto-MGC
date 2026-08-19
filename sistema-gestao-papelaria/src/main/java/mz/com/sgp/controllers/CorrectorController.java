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
import mz.com.sgp.controllers.docs.CorrectorControllerDocs;
import mz.com.sgp.data.dto.CorrectorDTO;
import mz.com.sgp.services.CorrectorServices;

@RestController
@RequestMapping("api/corrector/v1")
@Tag(name = "Corrector", description = "Endpoints for Managing Corrector")
public class CorrectorController implements CorrectorControllerDocs{
	
	@Autowired
	private CorrectorServices correctorServices;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<CorrectorDTO>>> findAll(
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

		    return ResponseEntity.ok(correctorServices.findAll(pageable, search));
    }
	
    @GetMapping(value = "/{id}",
            produces = {
                    MediaType.APPLICATION_JSON_VALUE,
                    MediaType.APPLICATION_XML_VALUE,
                    MediaType.APPLICATION_YAML_VALUE}
    )
	public CorrectorDTO findById(@PathVariable("id") Long id) {
		return correctorServices.findById(id);
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public CorrectorDTO create(@RequestBody CorrectorDTO corrector) {
		return correctorServices.create(corrector);
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public CorrectorDTO update(@RequestBody CorrectorDTO corrector) {
		return correctorServices.update(corrector);
	}

    @PatchMapping(value = "/disableClient/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public CorrectorDTO disableCorrector(@PathVariable("id") Long id) {
        return correctorServices.disableCorrector(id);
    }
    
    @GetMapping("/countClients")
    public long countClients() {
        return correctorServices.countCorrectors();
    }

}
