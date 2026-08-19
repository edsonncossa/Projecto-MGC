package mz.com.sgp.controllers;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mz.com.sgp.controllers.docs.ConsumptionControllerDocs;
import mz.com.sgp.data.dto.ConsumptionDTO;
import mz.com.sgp.services.ConsumptionServices;

@RestController
@RequestMapping("api/consumption/v1")
public class ConsumptionController implements ConsumptionControllerDocs {

    @Autowired
    private ConsumptionServices consumptionServices;

    @Override
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PagedModel<EntityModel<ConsumptionDTO>>> filterConsumptions(
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(value = "startDate", required = false) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) LocalDateTime endDate,
            @RequestParam(value = "search", required = false, defaultValue = "") String search,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size,
            @RequestParam(value = "direction", defaultValue = "desc") String direction,
            @RequestParam(value = "sortField", defaultValue = "consumptionDate") String sortField
    ) {
        var sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        return ResponseEntity.ok(consumptionServices.filterConsumptions(clientId, startDate, endDate, search, pageable));
    }

    @Override
    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ConsumptionDTO> findById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(consumptionServices.findById(id));
    }

    @Override
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ConsumptionDTO> create(@RequestBody ConsumptionDTO consumptionDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consumptionServices.create(consumptionDTO));
    }

    @Override
    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ConsumptionDTO> update(@RequestBody ConsumptionDTO consumptionDTO) {
        return ResponseEntity.ok(consumptionServices.update(consumptionDTO));
    }

    @Override
    @PatchMapping(value = "/disableConsumption/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ConsumptionDTO> disableConsumption(@PathVariable("id") Long id) {
        return ResponseEntity.ok(consumptionServices.disableConsumption(id));
    }

    @Override
    @GetMapping(value = "/countConsumptions", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Long> countConsumptions() {
        return ResponseEntity.ok(consumptionServices.countConsumptions());
    }
}