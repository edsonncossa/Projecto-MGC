package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseObject;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import mz.com.sgp.config.audit.entity.EntityState;
import mz.com.sgp.controllers.ConsumptionController;
import mz.com.sgp.data.dto.ConsumptionDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.ConsumptionEntity;
import mz.com.sgp.repository.ConsumptionRepository;

@Service
public class ConsumptionServices {
	
	 private Logger logger = LoggerFactory.getLogger(ConsumptionServices.class.getName());

	    @Autowired
	    ConsumptionRepository consumptionRepository;

	    @Autowired
	    PagedResourcesAssembler<ConsumptionDTO> assembler;

	    @Transactional(readOnly = true)
	    public PagedModel<EntityModel<ConsumptionDTO>> filterConsumptions(
	            Long clientId, 
	            LocalDateTime startDate, 
	            LocalDateTime endDate, 
	            String search, 
	            Pageable pageable
	    ) {
	        Page<ConsumptionEntity> consumptions = consumptionRepository.filterConsumptions(
	                clientId, 
	                startDate, 
	                endDate, 
	                search, 
	                EntityState.ACTIVE, 
	                pageable
	        );

	        return buildPagedModel(pageable, consumptions, clientId, startDate, endDate, search);
	    }

	    @Transactional(readOnly = true)
	    public ConsumptionDTO findById(Long id) {
	        logger.info("Procurando consumo com o id: {}", id);

	        var entity = consumptionRepository.findById(id)
	                .orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado consumo com o id: " + id));

	        return parseObject(entity, ConsumptionDTO.class);
	    }

	    @Transactional
	    public ConsumptionDTO create(ConsumptionDTO dto) {
	        logger.info("Criando registro de consumo...");

	        var entity = parseObject(dto, ConsumptionEntity.class);
	        var savedEntity = consumptionRepository.save(entity);

	        return parseObject(savedEntity, ConsumptionDTO.class);
	    }

	    @Transactional
	    public ConsumptionDTO update(ConsumptionDTO dto) {
	        logger.info("Atualizando consumo com o id: {}", dto.getId());
	        
	        ConsumptionEntity entity = consumptionRepository.findById(dto.getId())
	                .orElseThrow(() -> new ResourceNotFoundException("Consumo não encontrado para o ID fornecido!"));

	        entity.setConsumptionDate(dto.getConsumptionDate());
	        entity.setFileImportId(dto.getFileImportId());
	        entity.setCorrectedVolume(dto.getCorrectedVolume());
	        entity.setClientId(dto.getClientId());

	        return parseObject(consumptionRepository.save(entity), ConsumptionDTO.class);
	    }

	    @Transactional
	    public ConsumptionDTO disableConsumption(Long id) {
	        logger.info("Desativando consumo com id: {}", id);

	        var entity = consumptionRepository.findById(id)
	                .orElseThrow(() -> new ResourceNotFoundException("Nenhum consumo encontrado para este ID!"));

	        entity.setStatus(EntityState.INACTIVE);
	        consumptionRepository.save(entity);

	        return parseObject(entity, ConsumptionDTO.class);
	    }

	    @Transactional(readOnly = true)
	    public long countConsumptions() {
	        return consumptionRepository.countByStatus(EntityState.ACTIVE);
	    }

	    private PagedModel<EntityModel<ConsumptionDTO>> buildPagedModel(
	            Pageable pageable, 
	            Page<ConsumptionEntity> consumptionsEntity,
	            Long clientId, 
	            LocalDateTime startDate, 
	            LocalDateTime endDate, 
	            String search
	    ) {
	        Page<ConsumptionDTO> pageDTO = consumptionsEntity.map(p -> parseObject(p, ConsumptionDTO.class));

	        for (ConsumptionDTO dto : pageDTO.getContent()) {
	            if (dto.getId() != null) {
	            	Link selfLink = linkTo(ConsumptionController.class)
	                        .slash(dto.getId())
	                        .withSelfRel();
	                dto.add(selfLink);	            }
	        }

	        return assembler.toModel(pageDTO);
	    }
		
	}


