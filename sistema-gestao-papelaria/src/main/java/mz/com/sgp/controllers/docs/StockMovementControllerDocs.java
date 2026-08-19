package mz.com.sgp.controllers.docs;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import mz.com.sgp.data.dto.CategoryDTO;
import mz.com.sgp.data.dto.StockMovementDTO;

public interface StockMovementControllerDocs {

	 @Operation(summary = "Listar Todos os movimentos dos produtos",
	            description = "Obtém a lista de todos os Movimentos dos produtos",
	            tags = {"StockMovement"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = {
	                                    @Content(
	                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
	                                            array = @ArraySchema(schema = @Schema(implementation = StockMovementDTO.class))
	                                    )
	                            }),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ResponseEntity<PagedModel<EntityModel<StockMovementDTO>>> findAll(
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction
	    );
	 
	 @Operation(summary = "Adicionar uma Novo Movimento",
	            description = "Adiciona um novo Movimento fornecendo uma representação em JSON, XML ou YML do cliente.",
	            tags = {"StockMovement"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = CategoryDTO.class))
	                    ),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 StockMovementDTO create(@RequestBody StockMovementDTO stockMovement);
	 
	 @Operation(summary = "Listar Movimentos por Produto e Status",
	            description = "Obtém movimentos de estoque filtrados por produto e status com paginação",
	            tags = {"StockMovement"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = {
	                                    @Content(
	                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
	                                            array = @ArraySchema(schema = @Schema(implementation = StockMovementDTO.class))
	                                    )
	                            }),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ResponseEntity<PagedModel<EntityModel<StockMovementDTO>>> findByStockIdAndStatus(
	            @PathVariable Long productId,
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction
	    );
}
