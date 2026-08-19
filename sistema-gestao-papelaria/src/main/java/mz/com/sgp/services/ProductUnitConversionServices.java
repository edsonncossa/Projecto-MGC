package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseListObjects;
import static mz.com.sgp.mapper.ObjectMapper.parseObject;

import java.util.List;

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
import mz.com.sgp.controllers.ProductUnitConversionController;
import mz.com.sgp.data.dto.ProductUnitConversionDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.ProductUnitConversionEntity;
import mz.com.sgp.repository.ProductUnitConversionRepository;

@Service
public class ProductUnitConversionServices {

	// private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(ProductUnitConversionServices.class.getName());

	@Autowired
	ProductUnitConversionRepository conversionRepository;

	@Autowired
	PagedResourcesAssembler<ProductUnitConversionDTO> assembler;

	public PagedModel<EntityModel<ProductUnitConversionDTO>> findAll(Pageable pageable, String search) {

		Page<ProductUnitConversionEntity> productUnitConversion;

		if (search != null && !search.isBlank()) {
			productUnitConversion = conversionRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			productUnitConversion = conversionRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, productUnitConversion, search);
	}

	public List<ProductUnitConversionDTO> findByProductIdAndStatus(Long id) {
		logger.info("Procurar um Convercao pelo id o id: " + id);

		var entity = conversionRepository.findByProductIdAndStatus(id, EntityState.ACTIVE);

		if (entity.isEmpty()) {
			throw new ResourceNotFoundException("Não foram encontradas conversões para o produto com id: " + id);
		}

		var dto = parseListObjects(entity, ProductUnitConversionDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public ProductUnitConversionDTO create(ProductUnitConversionDTO productUnitConversion) {

		logger.info("Foi criado um cliente: " + productUnitConversion);

		var entity = parseObject(productUnitConversion, ProductUnitConversionEntity.class);

		var dto = parseObject(conversionRepository.save(entity), ProductUnitConversionDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public ProductUnitConversionDTO update(ProductUnitConversionDTO productUnitConversion) {

		logger.info("Atualizando Unidade!");
		ProductUnitConversionEntity entity = conversionRepository.findById(productUnitConversion.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Não encontrada Unidade para esse Id!"));

		entity.setProductId(productUnitConversion.getProductId());
		entity.setUnitId(productUnitConversion.getUnitId());
		entity.setConversionFactor(productUnitConversion.getConversionFactor());

		return parseObject(conversionRepository.save(entity), ProductUnitConversionDTO.class);
	}

	private PagedModel<EntityModel<ProductUnitConversionDTO>> buildPagedModel(Pageable pageable,
			Page<ProductUnitConversionEntity> productUnitConversionEntity, String search) {

		var products = productUnitConversionEntity.map(p -> {
			var dto = parseObject(p, ProductUnitConversionDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder
				.linkTo(WebMvcLinkBuilder.methodOn(ProductUnitConversionController.class)
						.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search))
				.withSelfRel();

		return assembler.toModel(products, findAllLink);
	}

//	private void addHateoasLinks(ProductUnitConversionDTO dto) {
//		dto.add(linkTo(methodOn(ProductUnitConversionController.class).findAll(1, 12, "asc")).withRel("findAll")
//				.withType("GET"));
//	}

}
