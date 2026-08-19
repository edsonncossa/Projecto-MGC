package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseObject;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.transaction.Transactional;
import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.ClientController;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.ClientEntity;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.repository.FileImportRepository;
import mz.com.sgp.repository.FileImportRepository;

@Service
public class FileImportServices {
	
	 private Logger logger = LoggerFactory.getLogger(FileImportServices.class.getName());

	    @Autowired
	    FileImportRepository FileImportRepository;

	    @Autowired
	    PagedResourcesAssembler<FileImportDTO> assembler;

	    
	    public PagedModel<EntityModel<FileImportDTO>> findAll(Pageable pageable, String search) {

			Page<FileImportEntity> product;

			if (search != null && !search.isBlank()) {
				product = FileImportRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
			} else {
				product = FileImportRepository.findAll(pageable, EntityState.ACTIVE);
			}

			return buildPagedModel(pageable, product, search);
		}



public FileImportDTO findById(Long id) {
    logger.info("Procurar um corrector com o id: " + id);

    var entity = FileImportRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado corrector com o id: " + id));

    var dto =  parseObject(entity, FileImportDTO.class);
   // addHateoasLinks(dto);
    return dto;
}

public FileImportDTO create(FileImportDTO client) {

    logger.info("Foi criado um corrector: " + client);

    var entity = parseObject(client, FileImportEntity.class);

    var dto = parseObject(FileImportRepository.save(entity), FileImportDTO.class);
   // addHateoasLinks(dto);
    return dto;

}

public FileImportDTO update(FileImportDTO customer) {

    logger.info("Atualizando o corrector!");
    FileImportEntity entity = FileImportRepository.findById(customer.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Não encontrado corrector para esse Id!"));

    
    entity.setFileName(customer.getFileName());
    entity.setClientId(customer.getClientId());

    return parseObject(FileImportRepository.save(entity), FileImportDTO.class);
}

@Transactional
public FileImportDTO disableFileImport(Long id) {
    logger.info("A desativar um fileImport!");

    FileImportRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Nenhum registo encontrado para este ID!"));

    var entity = FileImportRepository.findById(id).get();

    entity.setStatus(EntityState.INACTIVE);

    FileImportRepository.save(entity);

    var dto = parseObject(entity, FileImportDTO.class);
   // addHateoasLinks(dto);
    return dto;
}

public long countFileImports() {
    return FileImportRepository.countByStatus(EntityState.ACTIVE);
}

private PagedModel<EntityModel<FileImportDTO>> buildPagedModel(Pageable pageable, Page<FileImportEntity> FileImportEntity,
		String search) {

	var fileImports = FileImportEntity.map(p -> {
		var dto = parseObject(p, FileImportDTO.class);
		return dto;
	});

	// Extrair sort corretamente
	String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

	String direction = pageable.getSort().stream().findFirst()
			.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

	Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(ClientController.class)
			.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

	return assembler.toModel(fileImports, findAllLink);
}
}

