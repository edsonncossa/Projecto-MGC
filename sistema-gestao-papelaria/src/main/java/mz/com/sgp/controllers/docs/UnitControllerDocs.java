package mz.com.sgp.controllers.docs;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import mz.com.sgp.data.dto.UnitDTO;

public interface UnitControllerDocs {

	 @Operation(summary = "Listar Todas as Unidades de produtos",
	            description = "Obtém a lista de todas as Unidades de produtos",
	            tags = {"Unit"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = {
	                                    @Content(
	                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
	                                            array = @ArraySchema(schema = @Schema(implementation = UnitDTO.class))
	                                    )
	                            }),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ResponseEntity<PagedModel<EntityModel<UnitDTO>>> findAll(
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction,
	            @RequestParam(value = "sortField", defaultValue = "name") String sortField,
	            @RequestParam(value = "search", required = false) String search
	    );
	 
	 @Operation(summary = "Adicionar uma Nova Unidade",
	            description = "Adiciona uma nova Unidade fornecendo uma representação em JSON, XML ou YML do cliente.",
	            tags = {"Unit"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = UnitDTO.class))
	                    ),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    UnitDTO create(@RequestBody UnitDTO unit);
	 
	 @Operation(summary = "Atualizar as informações da Unidade",
	            description = "Atualiza as informações da Unidade fornecendo uma representação em JSON, XML ou YML do Unidade atualizado.",
	            tags = {"Unit"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = UnitDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 UnitDTO update(@RequestBody UnitDTO unit);
}
