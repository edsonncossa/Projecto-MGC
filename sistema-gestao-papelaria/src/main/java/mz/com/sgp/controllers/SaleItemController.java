package mz.com.sgp.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.TopProductDTO;
import mz.com.sgp.services.SaleItemServices;

@RestController
@RequestMapping("api/saleItem/v1")
@Tag(name = "Sale", description = "Endpoints for Managing Sale")
public class SaleItemController {

	@Autowired
	private SaleItemServices saleItemServices;

	
	@GetMapping(value ="/get-top-products", produces = MediaType.APPLICATION_JSON_VALUE)
	public List<TopProductDTO> getSalesByWeek() {
	    return saleItemServices.getTopProducts();
	}
	

}
