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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.controllers.docs.StockControllerDocs;
import mz.com.sgp.data.dto.StockDTO;
import mz.com.sgp.services.StockServices;

@RestController
@RequestMapping("api/stock/v1")
@Tag(name = "Stock", description = "Endpoints for Managing Stock")
public class StockController implements StockControllerDocs {

	@Autowired
	StockServices stockServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ResponseEntity<PagedModel<EntityModel<StockDTO>>> findAll(
			@RequestParam(value = "page", defaultValue = "0") Integer page,
			@RequestParam(value = "size", defaultValue = "12") Integer size,
			@RequestParam(value = "direction", defaultValue = "asc") String direction,
			@RequestParam(value = "sortField", defaultValue = "id") String sortField,
            @RequestParam(value = "search", required = false) String search) {
		var sortDirection = "desc".equalsIgnoreCase(direction)
	            ? Sort.Direction.DESC
	            : Sort.Direction.ASC;

	    Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

	    return ResponseEntity.ok(stockServices.findAll(pageable, search));
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public StockDTO create(@RequestBody StockDTO Stock) {
		return stockServices.create(Stock);
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public StockDTO update(@RequestBody StockDTO stock) {
		return stockServices.update(stock);
	}
	
	 @GetMapping(value = "/{id}",
	            produces = {
	                    MediaType.APPLICATION_JSON_VALUE,
	                    MediaType.APPLICATION_XML_VALUE,
	                    MediaType.APPLICATION_YAML_VALUE}
	    )
		public StockDTO findById(@PathVariable("id") Long id) {
			return stockServices.findById(id);
		}
	 
	 @GetMapping(value = "/findByProductId/{id}",
	            produces = {
	                    MediaType.APPLICATION_JSON_VALUE,
	                    MediaType.APPLICATION_XML_VALUE,
	                    MediaType.APPLICATION_YAML_VALUE}
	    )
		public StockDTO findByProductId(@PathVariable("id") Long id) {
			return stockServices.findByProductId(id);
		}
}
