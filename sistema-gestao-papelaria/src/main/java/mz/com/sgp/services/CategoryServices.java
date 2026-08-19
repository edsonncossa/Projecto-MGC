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
import mz.com.sgp.controllers.CategoryController;
import mz.com.sgp.data.dto.CategoryDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.CategoryEntity;
import mz.com.sgp.repository.CategoryRepository;

@Service
public class CategoryServices {

	// private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(CategoryServices.class.getName());

	@Autowired
	CategoryRepository categoryRepository;

	@Autowired
	PagedResourcesAssembler<CategoryDTO> assembler;

	public PagedModel<EntityModel<CategoryDTO>> findAll(Pageable pageable, String search) {

		Page<CategoryEntity> category;

		if (search != null && !search.isBlank()) {
			category = categoryRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			category = categoryRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, category, search);
	}

	public CategoryDTO create(CategoryDTO category) {

		logger.info("Foi criado um cliente: " + category);

		var entity = parseObject(category, CategoryEntity.class);

		var dto = parseObject(categoryRepository.save(entity), CategoryDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	private PagedModel<EntityModel<CategoryDTO>> buildPagedModel(Pageable pageable, Page<CategoryEntity> categoryEntity,
			String search) {

		var products = categoryEntity.map(p -> {
			var dto = parseObject(p, CategoryDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(CategoryController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(products, findAllLink);
	}

//	private void addHateoasLinks(CategoryDTO dto) {
//        dto.add(linkTo(methodOn(CategoryController.class).findAll(1, 12, "asc")).withRel("findAll").withType("GET"));
//    }

	public CategoryDTO update(CategoryDTO category) {

		logger.info("Atualizando categoria!");
		CategoryEntity entity = categoryRepository.findById(category.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Não encontrado cliente para esse Id!"));

		entity.setName(category.getName());
		entity.setDescription(category.getDescription());

		return parseObject(categoryRepository.save(entity), CategoryDTO.class);
	}
}
