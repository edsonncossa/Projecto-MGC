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

import jakarta.transaction.Transactional;
import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.ProductController;
import mz.com.sgp.data.dto.ProductDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.ProductEntity;
import mz.com.sgp.repository.ProductRepository;

@Service
public class ProductServices {

//	private final AtomicLong counter = new AtomicLong();

	private Logger logger = LoggerFactory.getLogger(ProductServices.class.getName());

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	PagedResourcesAssembler<ProductDTO> assembler;

	public PagedModel<EntityModel<ProductDTO>> findAll(Pageable pageable, String search) {

		Page<ProductEntity> product;

		if (search != null && !search.isBlank()) {
			product = productRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			product = productRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, product, search);
	}

	public List<ProductDTO> findProductsWithStock() {

		logger.info("A obter todos os produtos com stock maior ou igual a 1!");

		var product = productRepository.findProductsWithStock(EntityState.ACTIVE);

		return parseListObjects(product, ProductDTO.class);
	}

	private PagedModel<EntityModel<ProductDTO>> buildPagedModel(Pageable pageable, Page<ProductEntity> productEntity,
			String search) {

		var products = productEntity.map(p -> {
			var dto = parseObject(p, ProductDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(ProductController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(products, findAllLink);
	}

	public ProductDTO findById(Long id) {
		logger.info("Procurar um produto com o id: " + id);

		var entity = productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado produto com o id: " + id));

		var dto = parseObject(entity, ProductDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}

	public List<ProductDTO> findProductsWithoutStock() {
		logger.info("Procurar todos os produtos que não estão em estoque.");

		var products = this.productRepository.findProductsWithoutStock(EntityState.ACTIVE);

		return parseListObjects(products, ProductDTO.class);
	}

	public List<ProductDTO> findAllProductsWithConversionByStatus() {
		logger.info("Procurar todos os produtos que não estão em estoque.");

		var products = this.productRepository.findAllProductsWithConversionByStatus(EntityState.ACTIVE);

		return parseListObjects(products, ProductDTO.class);
	}

	public ProductDTO create(ProductDTO product) {

		logger.info("Foi criado um produto: " + product);

		var entity = parseObject(product, ProductEntity.class);

		entity.setReference(generateReference(productRepository.findFirstByOrderByIdDesc().getId()));

		entity = productRepository.save(entity);

		var dto = parseObject(entity, ProductDTO.class);

		return dto;
	}

	public ProductDTO update(ProductDTO product) {

		logger.info("Atualizando o cliente!");
		ProductEntity entity = productRepository.findById(product.getId())
				.orElseThrow(() -> new ResourceNotFoundException("Não encontrado prodotp para esse Id!"));

		entity.setName(product.getName());
		entity.setDescription(product.getDescription());
		entity.setCategoryId(product.getCategoryId());
		entity.setUnitPrice(product.getUnitPrice());
		entity.setImage(product.getImage());

		return parseObject(productRepository.save(entity), ProductDTO.class);
	}

	@Transactional
	public ProductDTO disableProduct(Long id) {
		logger.info("A desativar um cliente!");

		productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Nenhum registo encontrado para este ID!"));

		var entity = productRepository.findById(id).get();

		entity.setStatus(EntityState.INACTIVE);

		productRepository.save(entity);

		var dto = parseObject(entity, ProductDTO.class);
		// addHateoasLinks(dto);
		return dto;
	}
	
	public long countProducts() {
        return productRepository.countByStatus(EntityState.ACTIVE);
    }

	public String generateReference(Long id) {
		return String.format("PROD-%04d", id);
	}
}
