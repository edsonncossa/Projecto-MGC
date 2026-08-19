package mz.com.sgp.services;

import static mz.com.sgp.mapper.ObjectMapper.parseObject;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
import mz.com.sgp.controllers.SaleController;
import mz.com.sgp.data.dto.SaleDTO;
import mz.com.sgp.data.dto.SaleItemDTO;
import mz.com.sgp.data.dto.SalesByDayDTO;
import mz.com.sgp.data.dto.StockMovementDTO;
import mz.com.sgp.exception.ResourceNotFoundException;
import mz.com.sgp.model.MovementType;
import mz.com.sgp.model.SaleEntity;
import mz.com.sgp.model.SaleStatus;
import mz.com.sgp.model.StockEntity;
import mz.com.sgp.repository.SaleRepository;
import mz.com.sgp.repository.StockRepository;

@Service
public class SaleServices {

	private Logger logger = LoggerFactory.getLogger(SaleServices.class.getName());

	@Autowired
	private StockMovementServices stockMovementServices;

	@Autowired
	private SaleItemServices saleItemServices;

	@Autowired
	private SaleRepository saleRepository;

	@Autowired
	private StockRepository stockRepository;

	@Autowired
	PagedResourcesAssembler<SaleDTO> assembler;

	@Transactional
	public SaleDTO create(SaleDTO sale, List<SaleItemDTO> saleItems) {
		logger.info("Iniciando criação da venda...");

		var entity = parseObject(sale, SaleEntity.class);
		entity = saleRepository.save(entity);

		try {
			for (SaleItemDTO itemDTO : saleItems) {
				itemDTO.setSaleId(entity.getId());

				StockEntity stockEntity = stockRepository
						.findFirstByProductIdAndStatus(itemDTO.getProductId(), EntityState.ACTIVE)
						.orElseThrow(() -> new ResourceNotFoundException(
								"Estoque não encontrado para produto ID: " + itemDTO.getProductId()));

				if (stockEntity.getQuantity() < itemDTO.getQuantity()) {
					throw new RuntimeException("Stock insuficiente para o produto ID " + itemDTO.getProductId()
							+ ". Disponível: " + stockEntity.getQuantity() + ", solicitado: " + itemDTO.getQuantity());
				}

				// Criar movimento de stock
				StockMovementDTO movement = new StockMovementDTO();
				movement.setQuantity(itemDTO.getQuantity());
				movement.setType(MovementType.EXIT);
				movement.setStockId(stockEntity.getId()); // ✅ Usar ID do estoque, não do produto

				stockMovementServices.create(movement);
			}

			saleItemServices.create(saleItems);
			return parseObject(entity, SaleDTO.class);

		} catch (Exception e) {
			logger.error("Erro ao processar venda: {}", e.getMessage(), e);
			throw e; // Garante rollback consistente
		}
	}

	public PagedModel<EntityModel<SaleDTO>> findAll(Pageable pageable, String search) {

		Page<SaleEntity> sale;

		if (search != null && !search.isBlank()) {
			sale = saleRepository.search(search.toLowerCase(), EntityState.ACTIVE, pageable);
		} else {
			sale = saleRepository.findAll(pageable, EntityState.ACTIVE);
		}

		return buildPagedModel(pageable, sale, search);
	}

	public Long countByCreatedDateBetweenAndSaleStatusAndStatus() {

		LocalDate today = LocalDate.now();

		LocalDateTime start = today.atStartOfDay();
		LocalDateTime end = today.plusDays(1).atStartOfDay();

		return saleRepository.countByCreatedDateBetweenAndSaleStatusAndStatus(start, end, SaleStatus.COMPLETED,
				EntityState.ACTIVE);
	}

	public Long countSalesCurrentMonth() {

		ZoneId zone = ZoneId.systemDefault();

		LocalDate now = LocalDate.now(zone);

		// primeiro dia do mês às 00:00
		LocalDateTime start = now.withDayOfMonth(1).atStartOfDay();

		// primeiro dia do próximo mês às 00:00
		LocalDateTime end = now.plusMonths(1).withDayOfMonth(1).atStartOfDay();

		return saleRepository.countSalesCurrentMonth(start, end, SaleStatus.COMPLETED, EntityState.ACTIVE);
	}

	private PagedModel<EntityModel<SaleDTO>> buildPagedModel(Pageable pageable, Page<SaleEntity> sale, String search) {

		var products = sale.map(p -> {
			var dto = parseObject(p, SaleDTO.class);
			return dto;
		});

		// Extrair sort corretamente
		String sortField = pageable.getSort().stream().findFirst().map(order -> order.getProperty()).orElse("name");

		String direction = pageable.getSort().stream().findFirst()
				.map(order -> order.getDirection().name().toLowerCase()).orElse("asc");

		Link findAllLink = WebMvcLinkBuilder.linkTo(WebMvcLinkBuilder.methodOn(SaleController.class)
				.findAll(pageable.getPageNumber(), pageable.getPageSize(), direction, sortField, search)).withSelfRel();

		return assembler.toModel(products, findAllLink);
	}

	public List<SalesByDayDTO> findSalesByWeek() {

		LocalDate today = LocalDate.now();

		LocalDateTime start = today.with(DayOfWeek.MONDAY).atStartOfDay();
		LocalDateTime end = today.with(DayOfWeek.SUNDAY).atTime(23, 59, 59);

		List<Object[]> result = saleRepository.findSalesByWeek(start, end, SaleStatus.COMPLETED, EntityState.ACTIVE);

		Map<Integer, String> days = Map.of(1, "DOM", 2, "SEG", 3, "TER", 4, "QUA", 5, "QUI", 6, "SEX", 7, "SAB");

		// 🔥 inicializar semana completa com 0
		Map<String, Integer> sales = new LinkedHashMap<>();
		sales.put("SEG", 0);
		sales.put("TER", 0);
		sales.put("QUA", 0);
		sales.put("QUI", 0);
		sales.put("SEX", 0);
		sales.put("SAB", 0);
		sales.put("DOM", 0);

		for (Object[] r : result) {

			Integer day = (Integer) r[0]; // DAYOFWEEK
			Long count = (Long) r[1];

			String label = days.get(day);

			if (label != null) {
				sales.put(label, count.intValue());
			}
		}

		return sales.entrySet().stream().map(e -> new SalesByDayDTO(e.getKey(), e.getValue())).toList();
	}

}
