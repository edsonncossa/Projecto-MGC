package mz.com.sgp.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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
            @RequestParam(value = "clientIds", required = false) List<Long> clientIds,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
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

        return ResponseEntity.ok(consumptionServices.filterConsumptions(clientIds, startDate, endDate, search, pageable));
    }
    
    @Override
    @GetMapping(value = "/compare", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> compareConsumptions(
            @RequestParam(value = "clientIds", required = false) List<Long> clientIds,
            @RequestParam(value = "startDate1") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate1,
            @RequestParam(value = "endDate1") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate1,
            @RequestParam(value = "startDate2") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate2,
            @RequestParam(value = "endDate2") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate2,
            @RequestParam(value = "search", required = false, defaultValue = "") String search,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "1000") Integer size,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "sortField", defaultValue = "consumptionDate") String sortField
    ) {
        var sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));

        Map<String, Object> comparisonData = consumptionServices.compareConsumptions(
                clientIds, startDate1, endDate1, startDate2, endDate2, search, pageable
        );

        return ResponseEntity.ok(comparisonData);
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