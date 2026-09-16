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
import mz.com.sgp.data.dto.FileImportDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.FileImportEntity;
import mz.com.sgp.repository.FileImportRepository;

@Service
public class FileImportServices {

    private Logger logger = LoggerFactory.getLogger(FileImportServices.class.getName());

    @Autowired
    private FileImportRepository fileImportRepository;

    @Autowired
    private PagedResourcesAssembler<FileImportDTO> assembler;

    public PagedModel<EntityModel<FileImportDTO>> findAll(Pageable pageable, String search) {

        Page<FileImportEntity> product;

        if (search != null && !search.isBlank()) {
            product = fileImportRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
        } else {
            product = fileImportRepository.findAll(pageable, EntityState.ACTIVE);
        }

        return buildPagedModel(pageable, product, search);
    }

    public FileImportDTO findById(Long id) {
        logger.info("Procurar um ficheiro de importação com o id: " + id);

        var entity = fileImportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado ficheiro de importação com o id: " + id));

        var dto = parseObject(entity, FileImportDTO.class);
        return dto;
    }

    public FileImportDTO create(FileImportDTO dto) {

        logger.info("Foi criado um registo de importação: " + dto);

        var entity = parseObject(dto, FileImportEntity.class);

        var savedDto = parseObject(fileImportRepository.save(entity), FileImportDTO.class);
        return savedDto;

    }

    public FileImportDTO update(FileImportDTO customer) {

        logger.info("Atualizando o ficheiro de importação!");
        FileImportEntity entity = fileImportRepository.findById(customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Não encontrado registo para esse Id!"));

        entity.setFileName(customer.getFileName());
        entity.setClientId(customer.getClientId());

        return parseObject(fileImportRepository.save(entity), FileImportDTO.class);
    }

    @Transactional
    public FileImportDTO disableFileImport(Long id) {
        logger.info("A desativar um fileImport!");

        FileImportEntity entity = fileImportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum registo encontrado para este ID!"));

        entity.setStatus(EntityState.INACTIVE);

        fileImportRepository.save(entity);

        var dto = parseObject(entity, FileImportDTO.class);
        return dto;
    }

    public long countFileImports() {
        return fileImportRepository.countByStatus(EntityState.ACTIVE);
    }

    private PagedModel<EntityModel<FileImportDTO>> buildPagedModel(Pageable pageable, Page<FileImportEntity> fileImportEntities,
            String search) {

        var fileImports = fileImportEntities.map(p -> parseObject(p, FileImportDTO.class));

        // Extrair ordenação mantendo "fileDate" como padrão secundário de ordenação para consultas
        String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("fileDate");

        String direction = pageable.getSort().stream().findFirst()
                .map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

        Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(ClientController.class)
                .findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

        return assembler.toModel(fileImports, findAllLink);
    }
}