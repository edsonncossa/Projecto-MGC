package mz.com.sgp.controllers.docs;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import mz.com.sgp.data.dto.ConsumptionDTO;

@Tag(name = "Consumption", description = "Endpoints para Gestão de Consumos")
public interface ConsumptionControllerDocs {

    @Operation(summary = "Listar e Filtrar Consumos",
            description = "Obtém a lista paginada de consumos podendo filtrar por Cliente, intervalo de datas e termo de pesquisa.",
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = @Content(
                                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                                    array = @ArraySchema(schema = @Schema(implementation = ConsumptionDTO.class))
                            )),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<PagedModel<EntityModel<ConsumptionDTO>>> filterConsumptions(
            @Parameter(description = "ID do Cliente para filtrar os consumos")
            @RequestParam(value = "clientId", required = false) Long clientId,

            @Parameter(description = "Data inicial do intervalo (Formato: YYYY-MM-DDTHH:mm:ss)")
            @RequestParam(value = "startDate", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,

            @Parameter(description = "Data final do intervalo (Formato: YYYY-MM-DDTHH:mm:ss)")
            @RequestParam(value = "endDate", required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,

            @Parameter(description = "Termo para busca textual pelo nome do cliente")
            @RequestParam(value = "search", required = false, defaultValue = "") String search,

            @Parameter(description = "Número da página (inicia em 0)")
            @RequestParam(value = "page", defaultValue = "0") Integer page,

            @Parameter(description = "Quantidade de registos por página")
            @RequestParam(value = "size", defaultValue = "12") Integer size,

            @Parameter(description = "Direção da ordenação (asc ou desc)")
            @RequestParam(value = "direction", defaultValue = "desc") String direction,

            @Parameter(description = "Campo utilizado para ordenação")
            @RequestParam(value = "sortField", defaultValue = "consumptionDate") String sortField
    );

    @Operation(summary = "Encontrar um Consumo por ID",
            description = "Encontra um consumo específico fornecendo o seu ID único.",
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = @Content(schema = @Schema(implementation = ConsumptionDTO.class))
                    ),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<ConsumptionDTO> findById(@PathVariable("id") Long id);

    @Operation(summary = "Adicionar um Novo Consumo",
            description = "Adiciona um novo registo de consumo no sistema.",
            responses = {
                    @ApiResponse(
                            description = "Created",
                            responseCode = "201",
                            content = @Content(schema = @Schema(implementation = ConsumptionDTO.class))
                    ),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<ConsumptionDTO> create(@RequestBody ConsumptionDTO consumptionDTO);

    @Operation(summary = "Atualizar informações de um Consumo",
            description = "Atualiza os dados de um consumo existente.",
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = @Content(schema = @Schema(implementation = ConsumptionDTO.class))
                    ),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<ConsumptionDTO> update(@RequestBody ConsumptionDTO consumptionDTO);

    @Operation(summary = "Desativar um Consumo",
            description = "Desativa um registo de consumo através do seu ID (Soft Delete).",
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = @Content(schema = @Schema(implementation = ConsumptionDTO.class))
                    ),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<ConsumptionDTO> disableConsumption(@PathVariable("id") Long id);

    @Operation(summary = "Contar Consumos Ativos",
            description = "Retorna a contagem total de consumos ativos no sistema.",
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = @Content(schema = @Schema(implementation = Long.class))
                    ),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<Long> countConsumptions();
}