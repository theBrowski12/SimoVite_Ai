package cf.catalog_service.configs;

import cf.catalog_service.srevices.CatalogServiceImpl;
import cf.catalog_service.srevices.ReviewServiceImpl;
import cf.catalog_service.srevices.StoreServiceImpl;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpToolsConfig {

    @Bean
    public ToolCallbackProvider catalogTools(CatalogServiceImpl catalogService, StoreServiceImpl storeService, ReviewServiceImpl reviewService) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(catalogService, storeService, reviewService)
                .build();
    }
}
