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
import mz.com.sgp.data.dto.ClientDTO;
import mz.com.sgp.data.dto.StockDTO;

public interface StockControllerDocs {

	 @Operation(summary = "Listar Todo as Estoque de produtos",
	            description = "Obtém a lista de todo Estoque de produtos",
	            tags = {"Stock"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = {
	                                    @Content(
	                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
	                                            array = @ArraySchema(schema = @Schema(implementation = StockDTO.class))
	                                    )
	                            }),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ResponseEntity<PagedModel<EntityModel<StockDTO>>> findAll(
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction,
	            @RequestParam(value = "sortField", defaultValue = "name") String sortField,
	            @RequestParam(value = "search", required = false) String search
	    );
	 
	 @Operation(summary = "Adicionar Novo Estoque",
	            description = "Adiciona um novo Estoque fornecendo uma representação em JSON, XML ou YML do cliente.",
	            tags = {"Stock"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = StockDTO.class))
	                    ),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    StockDTO create(@RequestBody StockDTO category);
	 
	 @Operation(summary = "Atualizar as informações de um Cliente",
	            description = "Atualiza as informações de um cliente fornecendo uma representação em JSON, XML ou YML do cliente atualizado.",
	            tags = {"Client"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ClientDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    StockDTO update(@RequestBody StockDTO stock);
	 
	 @Operation(summary = "Encontrar um Estoque",
	            description = "Encontra um Estoque específico pelo seu ID",
	            tags = {"Stock"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = StockDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 StockDTO findById(@PathVariable("id") Long id);
	 
	 
	 @Operation(summary = "Encontrar um Estoque",
	            description = "Encontra um Estoque específico pelo seu ID do produto",
	            tags = {"Stock"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = StockDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 StockDTO findByProductId(@PathVariable("id") Long id);
}
