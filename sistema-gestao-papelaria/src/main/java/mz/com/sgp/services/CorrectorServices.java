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
import mz.com.sgp.controllers.ClientController;
import mz.com.sgp.data.dto.CorrectorDTO;
import mz.com.sgp.data.dto.CorrectorDTO;
import mz.com.sgp.data.dto.CorrectorDTO;
import mz.com.sgp.data.dto.CorrectorDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.repository.CorrectorRepository;

@Service
public class CorrectorServices {
	
	 private Logger logger = LoggerFactory.getLogger(CorrectorServices.class.getName());

	    @Autowired
	    CorrectorRepository correctorRepository;

	    @Autowired
	    PagedResourcesAssembler<CorrectorDTO> assembler;

	    
	    public PagedModel<EntityModel<CorrectorDTO>> findAll(Pageable pageable, String search) {

			Page<CorrectorEntity> product;

			if (search != null && !search.isBlank()) {
				product = correctorRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
			} else {
				product = correctorRepository.findAll(pageable, EntityState.ACTIVE);
			}

			return buildPagedModel(pageable, product, search);
		}



public CorrectorDTO findById(Long id) {
    logger.info("Procurar um corrector com o id: " + id);

    var entity = correctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado corrector com o id: " + id));

    var dto =  parseObject(entity, CorrectorDTO.class);
   // addHateoasLinks(dto);
    return dto;
}

public CorrectorDTO create(CorrectorDTO client) {

    logger.info("Foi criado um corrector: " + client);

    var entity = parseObject(client, CorrectorEntity.class);

    var dto = parseObject(correctorRepository.save(entity), CorrectorDTO.class);
   // addHateoasLinks(dto);
    return dto;

}

public CorrectorDTO update(CorrectorDTO customer) {

    logger.info("Atualizando o corrector!");
    CorrectorEntity entity = correctorRepository.findById(customer.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Não encontrado corrector para esse Id!"));

    entity.setName(customer.getName());
    entity.setModel(customer.getModel());
    entity.setSerialNumber(customer.getSerialNumber());
    entity.setDownloadExtension(customer.getDownloadExtension());

    return parseObject(correctorRepository.save(entity), CorrectorDTO.class);
}

@Transactional
public CorrectorDTO disableCorrector(Long id) {
    logger.info("A desativar um corrector!");

    correctorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Nenhum registo encontrado para este ID!"));

    var entity = correctorRepository.findById(id).get();

    entity.setStatus(EntityState.INACTIVE);

    correctorRepository.save(entity);

    var dto = parseObject(entity, CorrectorDTO.class);
   // addHateoasLinks(dto);
    return dto;
}

public long countCorrectors() {
    return correctorRepository.countByStatus(EntityState.ACTIVE);
}

private PagedModel<EntityModel<CorrectorDTO>> buildPagedModel(Pageable pageable, Page<CorrectorEntity> CorrectorEntity,
		String search) {

	var correctors = CorrectorEntity.map(p -> {
		var dto = parseObject(p, CorrectorDTO.class);
		return dto;
	});

	// Extrair sort corretamente
	String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

	String direction = pageable.getSort().stream().findFirst()
			.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

	Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(ClientController.class)
			.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

	return assembler.toModel(correctors, findAllLink);
}
}

