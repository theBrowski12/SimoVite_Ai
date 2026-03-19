package cf.delivery_service.repository;

import cf.delivery_service.entity.CourierLocation;
import org.springframework.data.repository.CrudRepository;

public interface CourierLocationRepository extends CrudRepository<CourierLocation, String> {
}
