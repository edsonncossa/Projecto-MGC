package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseListObjects;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.data.dto.SaleItemDTO;
import mz.com.sgp.data.dto.TopProductDTO;
import mz.com.sgp.model.SaleItemEntity;
import mz.com.sgp.model.SaleStatus;
import mz.com.sgp.repository.SaleItemRepository;

@Service
public class SaleItemServices {

	private Logger logger = LoggerFactory.getLogger(SaleItemServices.class.getName());

	@Autowired
	private SaleItemRepository saleItemRepository;

	public List<SaleItemDTO> create(List<SaleItemDTO> saleItems) {

		logger.info("Foi criado um : " + saleItems);

		var entitys = parseListObjects(saleItems, SaleItemEntity.class);

		var savedentitys = saleItemRepository.saveAll(entitys);

		var dto = parseListObjects(savedentitys, SaleItemDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public List<TopProductDTO> getTopProducts() {
		return saleItemRepository.findTopProducts(SaleStatus.COMPLETED, EntityState.ACTIVE).stream()
				.map(r -> new TopProductDTO((Long) r[0], (String) r[1], (String) r[2], (BigDecimal) r[3],
						((Long) r[4]).intValue(), (BigDecimal) r[5]))
				.toList();
	}

}
