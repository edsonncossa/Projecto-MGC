package mz.com.sgp.controllers.docs;

import java.util.List;

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
import mz.com.sgp.data.dto.ProductUnitConversionDTO;

public interface ProductUnitConversionControllerDocs {

	 @Operation(summary = "Listar todos os actores de conversão",
	            description = "Obtêm a lista de todos os factores de conversão",
	            tags = {"ProductUnitConversion"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = {
	                                    @Content(
	                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
	                                            array = @ArraySchema(schema = @Schema(implementation = ProductUnitConversionDTO.class))
	                                    )
	                            }),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ResponseEntity<PagedModel<EntityModel<ProductUnitConversionDTO>>> findAll(
	            @RequestParam(value = "page", defaultValue = "0") Integer page,
	            @RequestParam(value = "size", defaultValue = "12") Integer size,
	            @RequestParam(value = "direction", defaultValue = "asc") String direction,
	            @RequestParam(value = "sortField", defaultValue = "id") String sortField,
	            @RequestParam(value = "search", required = false) String search
	    );
	 
	 @Operation(summary = "Encontrar todos os factores de convercao de um produto",
	            description = "Encontra os factores de convercao de um produto específico pelo seu ID do produto",
	            tags = {"ProductUnitConversion"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductUnitConversionDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    List<ProductUnitConversionDTO> findByProductId(@PathVariable("id") Long id);
	 
	 
	 @Operation(summary = "Adicionar uma novo factor de conversão",
	            description = "Adicionar uma novo factor de conversão fornecendo uma representação em JSON, XML ou YML do ProductUnitConversion.",
	            tags = {"ProductUnitConversion"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductUnitConversionDTO.class))
	                    ),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 ProductUnitConversionDTO create(@RequestBody ProductUnitConversionDTO productUnitConversion);
	 
	 @Operation(summary = "Atualizar as informações do factor de conversão",
	            description = "Atualiza as informações do factor de conversão fornecendo uma representação em JSON, XML ou YML do cliente atualizado.",
	            tags = {"ProductUnitConversion"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductUnitConversionDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	 ProductUnitConversionDTO update(@RequestBody ProductUnitConversionDTO productUnitConversion);
}
