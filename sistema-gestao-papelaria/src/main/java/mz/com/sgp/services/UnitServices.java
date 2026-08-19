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

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.UnitController;
import mz.com.sgp.data.dto.UnitDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.UnitEntity;
import mz.com.sgp.repository.UnitRepository;

@Service
public class UnitServices {

	// private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(UnitServices.class.getName());

	@Autowired
	UnitRepository unitRepository;

	@Autowired
	PagedResourcesAssembler<UnitDTO> assembler;

	public PagedModel<EntityModel<UnitDTO>> findAll(Pageable pageable, String search) {

		Page<UnitEntity> product;

		if (search != null && !search.isBlank()) {
			product = unitRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			product = unitRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, product, search);
	}

	public UnitDTO create(UnitDTO unit) {

		logger.info("Foi criado um cliente: " + unit);

		var entity = parseObject(unit, UnitEntity.class);

		var dto = parseObject(unitRepository.save(entity), UnitDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public UnitDTO update(UnitDTO unit) {

		logger.info("Atualizando o Unidade!");
		UnitEntity entity = unitRepository.findById(unit.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Não encontrada Unidade para esse Id!"));

		entity.setName(unit.getName());
		entity.setSymbol(unit.getSymbol());
		entity.setDescription(unit.getDescription());

		return parseObject(unitRepository.save(entity), UnitDTO.class);
	}

	private PagedModel<EntityModel<UnitDTO>> buildPagedModel(Pageable pageable, Page<UnitEntity> unitEntity,
			String search) {

		var products = unitEntity.map(p -> {
			var dto = parseObject(p, UnitDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(UnitController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(products, findAllLink);
	}

//	private void addHateoasLinks(UnitDTO dto) {
//        dto.add(linkTo(methodOn(UnitController.class).findAll(1, 12, "asc")).withRel("findAll").withType("GET"));
//    }

}
