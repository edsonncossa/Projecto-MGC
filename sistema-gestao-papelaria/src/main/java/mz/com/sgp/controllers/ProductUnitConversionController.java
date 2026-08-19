package mz.com.sgp.controllers;

import java.util.List;

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
import mz.com.sgp.controllers.docs.ProductUnitConversionControllerDocs;
import mz.com.sgp.data.dto.ProductUnitConversionDTO;
import mz.com.sgp.services.ProductUnitConversionServices;

@RestController
@RequestMapping("api/product-unit-conversion/v1")
@Tag(name = "Category", description = "Endpoints for Managing Category")
public class ProductUnitConversionController implements ProductUnitConversionControllerDocs{
	
	@Autowired
	ProductUnitConversionServices productUnitConversionServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<ProductUnitConversionDTO>>> findAll(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "sortField", defaultValue = "id") String sortField,
            @RequestParam(value = "search", required = false) String search
    ) {
		 var sortDirection = "desc".equalsIgnoreCase(direction)
		            ? Sort.Direction.DESC
		            : Sort.Direction.ASC;

		    Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		    return ResponseEntity.ok(productUnitConversionServices.findAll(pageable, search));
    }
	
	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
	public ProductUnitConversionDTO create(@RequestBody ProductUnitConversionDTO productUnitConversion) {
		return productUnitConversionServices.create(productUnitConversion);
	}

	 @GetMapping(value = "/findByProductId/{id}",
     produces = {
             MediaType.APPLICATION_JSON_VALUE,
             MediaType.APPLICATION_XML_VALUE,
             MediaType.APPLICATION_YAML_VALUE}
)
	@Override
	public List<ProductUnitConversionDTO> findByProductId(Long id) {
		return productUnitConversionServices.findByProductIdAndStatus(id);
	}
	 
	 @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	    @Override
		public ProductUnitConversionDTO update(@RequestBody ProductUnitConversionDTO productUnitConversion) {
			return productUnitConversionServices.update(productUnitConversion);
		}
}
