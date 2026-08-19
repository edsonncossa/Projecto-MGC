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
import mz.com.sgp.data.dto.ProductDTO;

public interface ProductControllerDocs {

	@Operation(summary = "Listar Todos os Produtos",
            description = "Obtém a lista de todos os Produtos",
            tags = {"Product"},
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = {
                                    @Content(
                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                                            array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class))
                                    )
                            }),
                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findAll(
    		@RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "sortField", defaultValue = "name") String sortField,
            @RequestParam(value = "search", required = false) String search
    );
	
	
	@Operation(summary = "Listar Todos os Produtos nao estocados",
            description = "Obtém a lista de todos os Produtos",
            tags = {"Product"},
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = {
                                    @Content(
                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                                            array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class))
                                    )
                            }),
                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    List<ProductDTO> findProductsWithoutStock();
	
	
	@Operation(summary = "Listar Todos os Produtos com estocados maior ou igual a 1",
            description = "Obtém a lista de todos os Produtos",
            tags = {"Product"},
            responses = {
                    @ApiResponse(
                            description = "Success",
                            responseCode = "200",
                            content = {
                                    @Content(
                                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                                            array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class))
                                    )
                            }),
                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
            }
    )
    List<ProductDTO> findProductsWithStock();
	
	
	
	 @Operation(summary = "Encontrar um Produto",
	            description = "Encontra um Produto específico pelo seu ID",
	            tags = {"Product"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ProductDTO findById(@PathVariable("id") Long id);

	    @Operation(summary = "Adicionar um Novo Produto",
	            description = "Adiciona um novo Produto fornecendo uma representação em JSON, XML ou YML do Produto.",
	            tags = {"Product"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductDTO.class))
	                    ),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ProductDTO create(@RequestBody ProductDTO person);

	    @Operation(summary = "Atualizar as informações de um Produto",
	            description = "Atualiza as informações de um Produto fornecendo uma representação em JSON, XML ou YML do Produto atualizado.",
	            tags = {"Product"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ProductDTO update(@RequestBody ProductDTO person);

	    @Operation(summary = "Desativar um Produto",
	            description = "Desativa um Produto específico através do seu ID",
	            tags = {"Product"},
	            responses = {
	                    @ApiResponse(
	                            description = "Success",
	                            responseCode = "200",
	                            content = @Content(schema = @Schema(implementation = ProductDTO.class))
	                    ),
	                    @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
	                    @ApiResponse(description = "Bad Request", responseCode = "400", content = @Content),
	                    @ApiResponse(description = "Unauthorized", responseCode = "401", content = @Content),
	                    @ApiResponse(description = "Not Found", responseCode = "404", content = @Content),
	                    @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
	            }
	    )
	    ProductDTO disableProduct(@PathVariable("id") Long id);
    
}
