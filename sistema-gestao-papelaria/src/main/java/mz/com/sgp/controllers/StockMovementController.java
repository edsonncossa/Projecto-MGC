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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.docs.StockMovementControllerDocs;
import mz.com.sgp.data.dto.StockMovementDTO;
import mz.com.sgp.services.StockMovementServices;

@RestController
@RequestMapping("api/stockMovement/v1")
@Tag(name = "StockMovement", description = "Endpoints for Managing StockMovement")
public class StockMovementController implements StockMovementControllerDocs {

	@Autowired
	StockMovementServices stockMovementServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ResponseEntity<PagedModel<EntityModel<StockMovementDTO>>> findAll(
			@RequestParam(value = "page", defaultValue = "0") Integer page,
			@RequestParam(value = "size", defaultValue = "12") Integer size,
			@RequestParam(value = "direction", defaultValue = "asc") String direction) {
		var sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, "product.name"));
		return ResponseEntity.ok(stockMovementServices.findAll(pageable));
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public StockMovementDTO create(@RequestBody StockMovementDTO stockMovement) {
		return stockMovementServices.create(stockMovement);
	}
	
	 @GetMapping(value = "/product/{productId}", produces = MediaType.APPLICATION_JSON_VALUE)
	    @Override
	    public ResponseEntity<PagedModel<EntityModel<StockMovementDTO>>> findByStockIdAndStatus(
	            @PathVariable Long productId,
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction) {
	        
	        var sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
	        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, "createdDate"));
	        
	        return ResponseEntity.ok(
	                stockMovementServices.findByStockIdAndStatus(productId, EntityState.ACTIVE, pageable)
	        );
	    }
	
}
