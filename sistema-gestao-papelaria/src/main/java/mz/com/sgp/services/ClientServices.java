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
import mz.com.sgp.data.dto.ClientDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.ClientEntity;
import mz.com.sgp.model.CorrectorEntity;
import mz.com.sgp.repository.ClientRepository;
import mz.com.sgp.repository.CorrectorRepository;

@Service
public class ClientServices {

    //private final AtomicLong counter = new AtomicLong();

    private Logger logger = LoggerFactory.getLogger(ClientServices.class.getName());

    @Autowired
    ClientRepository clientRepository;
    

    @Autowired
    PagedResourcesAssembler<ClientDTO> assembler;
    

    public PagedModel<EntityModel<ClientDTO>> findAll(Pageable pageable, String search) {

		Page<ClientEntity> product;

		if (search != null && !search.isBlank()) {
			product = clientRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			product = clientRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, product, search);
	}

    public ClientDTO findById(Long id) {
        logger.info("Procurar um cliente com o id: " + id);

        var entity = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Não foi encontrado cliente com o id: " + id));

        var dto =  parseObject(entity, ClientDTO.class);
       // addHateoasLinks(dto);
        return dto;
    }

    public ClientDTO create(ClientDTO client) {
        if (client == null) throw new ResourceNotFoundException("ClientDTO is null");

        var entity = parseObject(client, ClientEntity.class);
        entity.setStatus(EntityState.ACTIVE);
        

        var savedEntity = clientRepository.save(entity);

        return parseObject(savedEntity, ClientDTO.class);
    }

    public ClientDTO update(ClientDTO customer) {

        logger.info("Atualizando o cliente!");
        
        ClientEntity entity = clientRepository.findById(customer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Não encontrado cliente para esse Id!"));

        entity.setFirstName(customer.getFirstName());
        entity.setAddress(customer.getAddress());
        entity.setPhoneNumber(customer.getPhoneNumber());
        entity.setType(customer.getType());
        entity.setEmail(customer.getEmail());

        return parseObject(clientRepository.save(entity), ClientDTO.class);
    }

    @Transactional
    public ClientDTO disableClient(Long id) {
        logger.info("A desativar um cliente!");

        clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum registo encontrado para este ID!"));

        var entity = clientRepository.findById(id).get();

        entity.setStatus(EntityState.INACTIVE);

        clientRepository.save(entity);

        var dto = parseObject(entity, ClientDTO.class);
       // addHateoasLinks(dto);
        return dto;
    }
    
    
    public long countClients() {
        return clientRepository.countByStatus(EntityState.ACTIVE);
    }


    private PagedModel<EntityModel<ClientDTO>> buildPagedModel(Pageable pageable, Page<ClientEntity> clientEntity,
			String search) {

		var clients = clientEntity.map(p -> {
			var dto = parseObject(p, ClientDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(ClientController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(clients, findAllLink);
	}


}
