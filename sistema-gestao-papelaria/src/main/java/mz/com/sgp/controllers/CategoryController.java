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
import mz.com.sgp.controllers.docs.CategoryControllerDocs;
import mz.com.sgp.data.dto.CategoryDTO;
import mz.com.sgp.services.CategoryServices;

@RestController
@RequestMapping("api/category/v1")
@Tag(name = "Category", description = "Endpoints for Managing Category")
public class CategoryController implements CategoryControllerDocs{
	
	@Autowired
	CategoryServices categoryServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<CategoryDTO>>> findAll(
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

	    return ResponseEntity.ok(categoryServices.findAll(pageable, search));
    }
	
	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public CategoryDTO create(@RequestBody CategoryDTO category) {
		return categoryServices.create(category);
	}
	
	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public CategoryDTO update(@RequestBody CategoryDTO category) {
		return categoryServices.update(category);
	}
}
