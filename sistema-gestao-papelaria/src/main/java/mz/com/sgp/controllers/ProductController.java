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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.controllers.docs.ProductControllerDocs;
import mz.com.sgp.data.dto.ProductDTO;
import mz.com.sgp.services.ProductServices;

@RestController
@RequestMapping("api/product/v1")
@Tag(name = "Product", description = "Endpoints for Managing Product")
public class ProductController implements ProductControllerDocs {

	@Autowired
	ProductServices productServices;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findAll(
			@RequestParam(value = "page", defaultValue = "0") Integer page,
	        @RequestParam(value = "size", defaultValue = "12") Integer size,
	        @RequestParam(value = "direction", defaultValue = "asc") String direction,
	        @RequestParam(value = "sortField", defaultValue = "name") String sortField,
	        @RequestParam(value = "search", required = false) String search) {
		
		 var sortDirection = "desc".equalsIgnoreCase(direction)
		            ? Sort.Direction.DESC
		            : Sort.Direction.ASC;

		    Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		    return ResponseEntity.ok(productServices.findAll(pageable, search));
		}
	

	@GetMapping(value = "/findProductsWithoutStock", produces = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
	public List<ProductDTO> findProductsWithoutStock() {

		return productServices.findProductsWithoutStock();
	}

	@GetMapping(value = "/findProductsWithStock", produces = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
	public List<ProductDTO> findProductsWithStock() {

		return productServices.findProductsWithStock();
	}
	
	@GetMapping(value = "/findAllProductsWithConversionByStatus", produces = { MediaType.APPLICATION_JSON_VALUE,
			MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
	public List<ProductDTO> findAllProductsWithConversionByStatus() {

		return productServices.findAllProductsWithConversionByStatus();
	}

	@GetMapping(value = "/{id}", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE,
			MediaType.APPLICATION_YAML_VALUE })
	public ProductDTO findById(@PathVariable("id") Long id) {
		return productServices.findById(id);
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ProductDTO create(@RequestBody ProductDTO product) {
		return productServices.create(product);
	}

	@PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ProductDTO update(@RequestBody ProductDTO product) {
		return productServices.update(product);
	}

	@PatchMapping(value = "/disableProduct/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	@Override
	public ProductDTO disableProduct(@PathVariable("id") Long id) {
		return productServices.disableProduct(id);
	}
	
	@GetMapping("/countProducts")
    public long countProducts() {
        return productServices.countProducts();
    }

}
