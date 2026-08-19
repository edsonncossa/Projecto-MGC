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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.SaleDTO;
import mz.com.sgp.data.dto.SaleRequestDTO;
import mz.com.sgp.data.dto.SalesByDayDTO;
import mz.com.sgp.services.SaleServices;

@RestController
@RequestMapping("api/sale/v1")
@Tag(name = "Sale", description = "Endpoints for Managing Sale")
public class SaleController {

	@Autowired
	private SaleServices saleServices;

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public SaleDTO create(@RequestBody SaleRequestDTO saleRequestDTO) {
		return saleServices.create(saleRequestDTO.getSale(), saleRequestDTO.getItems());
	}

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<PagedModel<EntityModel<SaleDTO>>> findAll(
			@RequestParam(value = "page", defaultValue = "0") Integer page,
			@RequestParam(value = "size", defaultValue = "12") Integer size,
			@RequestParam(value = "direction", defaultValue = "asc") String direction,
			@RequestParam(value = "sortField", defaultValue = "") String sortField,
			@RequestParam(value = "search", required = false) String search) {
		var sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;

		Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

		return ResponseEntity.ok(saleServices.findAll(pageable, search));
	}

	@GetMapping(value = "/countByCreatedDate", produces = MediaType.APPLICATION_JSON_VALUE)
	public Long countByCreatedDateBetweenAndSaleStatusAndStatus() {
		return saleServices.countByCreatedDateBetweenAndSaleStatusAndStatus();
	}

	@GetMapping(value = "/countSalesCurrentMonth", produces = MediaType.APPLICATION_JSON_VALUE)
	public Long countSalesCurrentMonth() {
		return saleServices.countSalesCurrentMonth();
	}
	
	@GetMapping(value ="/find-sales-by-week", produces = MediaType.APPLICATION_JSON_VALUE)
	public List<SalesByDayDTO> getSalesByWeek() {
	    return saleServices.findSalesByWeek();
	}

}
