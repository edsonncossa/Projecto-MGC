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
import mz.com.sgp.controllers.StockMovementController;
import mz.com.sgp.data.dto.StockDTO;
import mz.com.sgp.data.dto.StockMovementDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.MovementType;
import mz.com.sgp.model.StockMovementEntity;
import mz.com.sgp.repository.StockMovementRepository;

@Service
public class StockMovementServices {

	// private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(StockMovementServices.class.getName());

	@Autowired
	private StockMovementRepository stockMovementRepository;

	@Autowired
	PagedResourcesAssembler<StockMovementDTO> assembler;

	@Autowired
	private StockServices stockServices;

	public PagedModel<EntityModel<StockMovementDTO>> findAll(Pageable pageable) {
		logger.info("A obter todos os Movimentos do Produto!");

		var stockMovement = stockMovementRepository.findAll(pageable);
		return buildPagedModel(pageable, stockMovement);
	}

	@Transactional
	public StockMovementDTO create(StockMovementDTO stockMovement) {

		logger.info("Foi adicionado um novo movimento: " + stockMovement);

		var entity = parseObject(stockMovement, StockMovementEntity.class);

		var dto = parseObject(stockMovementRepository.save(entity), StockMovementDTO.class);

		StockDTO stockDTO = stockServices.findById(dto.getStockId());

		if (dto.getType().equals(MovementType.EXIT)) {
			stockDTO.setQuantity(stockDTO.getQuantity() - dto.getQuantity());
		} else {
			stockDTO.setQuantity(stockDTO.getQuantity() + dto.getQuantity());
		}

		this.stockServices.update(stockDTO);

		// addHateoasLinks(dto);
		return dto;
	}

	public StockMovementDTO update(StockMovementDTO stockMovement) {

		logger.info("Atualizando Estoque!");
		StockMovementEntity entity = stockMovementRepository.findById(stockMovement.getId()).orElseThrow(
				() -> new ResourceNotFoundException("Não foi encontrado movimento de estoque para esse Id!"));

		entity.setType(stockMovement.getType());
		;
		entity.setStatus(stockMovement.getStatus());
		entity.setQuantity(stockMovement.getQuantity());

		return parseObject(stockMovementRepository.save(entity), StockMovementDTO.class);
	}

	public StockMovementDTO findByStockId(Long id) {
		logger.info("Procurar um Estoque com o id: " + id);

		var entity = stockMovementRepository.findByStockIdAndStatus(id, EntityState.ACTIVE);
		if (entity.isEmpty()) {
			throw new RuntimeException("Não foi encontrado movimento de estoque com o id: " + id);
		}

		var dto = parseObject(entity.get(0), StockMovementDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public PagedModel<EntityModel<StockMovementDTO>> findByStockIdAndStatus(Long productId, EntityState state,
			Pageable pageable) {

		logger.info("Procurar movimentos do produto com id: " + productId + " | Status: " + state);

		// 1. Buscar página do repository
		var entity = stockMovementRepository.findByStockIdAndStatus(productId, state, pageable);

		// 3. Construir PagedModel com HATEOAS
		return buildPagedModel(pageable, entity);
	}

	private PagedModel<EntityModel<StockMovementDTO>> buildPagedModel(Pageable pageable,
			Page<StockMovementEntity> stockMovement) {

		var stockMovementWithLinks = stockMovement.map(category -> {
			var dto = parseObject(category, StockMovementDTO.class);
			// addHateoasLinks(dto);
			return dto;
		});

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(StockMovementController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), String.valueOf(pageable.getSort())))
				.withSelfRel();
		return assembler.toModel(stockMovementWithLinks, findAllLink);
	}

//	private void addHateoasLinks(StockMovementDTO dto) {
//		dto.add(linkTo(methodOn(StockMovementController.class).findAll(1, 12, "asc")).withRel("findAll")
//				.withType("GET"));
//	}

}
