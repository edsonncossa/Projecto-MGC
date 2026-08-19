package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.StockController;
import mz.com.sgp.data.dto.StockDTO;
import mz.com.sgp.data.dto.StockMovementDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.MovementType;
import mz.com.sgp.model.StockEntity;
import mz.com.sgp.model.StockMovementEntity;
import mz.com.sgp.repository.StockMovementRepository;
import mz.com.sgp.repository.StockRepository;

@Service
public class StockServices {

	// private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(StockServices.class.getName());

	@Autowired
	private StockRepository stockRepository;

	@Autowired
	private PagedResourcesAssembler<StockDTO> assembler;

	@Autowired
	private StockMovementRepository stockMovementRepository;

	public PagedModel<EntityModel<StockDTO>> findAll(Pageable pageable, String search) {

		Page<StockEntity> productUnitConversion;

		if (search != null && !search.isBlank()) {
			productUnitConversion = stockRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			productUnitConversion = stockRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, productUnitConversion, search);
	}

	@Transactional
	public StockDTO create(StockDTO stock) {
		logger.info("Foi criado um Estoque: " + stock);

		var entity = parseObject(stock, StockEntity.class);
		var savedEntity = stockRepository.save(entity);

		// Criar movimento de entrada
		StockMovementDTO mov = new StockMovementDTO();
		mov.setStockId(savedEntity.getId());
		mov.setQuantity(savedEntity.getQuantity());
		mov.setType(MovementType.ENTRY);

		var movEntity = parseObject(mov, StockMovementEntity.class);
		stockMovementRepository.save(movEntity);

		return parseObject(savedEntity, StockDTO.class);
	}

	public StockDTO update(StockDTO stock) {

		logger.info("Atualizando Estoque!");
		StockEntity entity = stockRepository.findById(stock.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Não encontrado estoque para esse Id!"));

		entity.setProductId(stock.getProductId());
		entity.setStatus(stock.getStatus());
		entity.setQuantity(stock.getQuantity());

		return parseObject(stockRepository.save(entity), StockDTO.class);
	}

	public StockDTO findById(Long id) {
		logger.info("Procurar um Estoque com o id: " + id);

		var entity = stockRepository.findFirstByIdAndStatus(id, EntityState.ACTIVE)
				.orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado estoque com o id: " + id));

		var dto = parseObject(entity, StockDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public StockDTO findByProductId(Long id) {
		logger.info("Procurar um Estoque com o id: " + id);

		var entity = stockRepository.findFirstByProductIdAndStatus(id, EntityState.ACTIVE)
				.orElseThrow(() -> new RuntimeException("Não foi encontrado estoque com o id: " + id));

		var dto = parseObject(entity, StockDTO.class);
		return dto;
	}

	private PagedModel<EntityModel<StockDTO>> buildPagedModel(Pageable pageable, Page<StockEntity> stockEntity,
			String search) {

		var stocks = stockEntity.map(p -> {
			var dto = parseObject(p, StockDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(StockController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(stocks, findAllLink);
	}

}
