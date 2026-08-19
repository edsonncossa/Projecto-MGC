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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.controllers.docs.UnitControllerDocs;
import mz.com.sgp.data.dto.UnitDTO;
import mz.com.sgp.services.UnitServices;

@RestController
@RequestMapping("api/unit/v1")
@Tag(name = "Unit", description = "Endpoints for Managing Unit")
public class UnitController implements UnitControllerDocs {

	@Autowired
	UnitServices unitServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ResponseEntity<PagedModel<EntityModel<UnitDTO>>> findAll(
			@RequestParam(value = "page", defaultValue = "0") Integer page,
			@RequestParam(value = "size", defaultValue = "12") Integer size,
			@RequestParam(value = "direction", defaultValue = "asc") String direction,
			@RequestParam(value = "sortField", defaultValue = "name") String sortField,
			@RequestParam(value = "search", required = false) String search) {
		var sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		return ResponseEntity.ok(unitServices.findAll(pageable, search));
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public UnitDTO create(@RequestBody UnitDTO unit) {
		return unitServices.create(unit);
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public UnitDTO update(@RequestBody UnitDTO unit) {
		return unitServices.update(unit);
	}
}
