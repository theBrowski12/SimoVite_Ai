import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FoodCategory, PharmacyCategory, SupermarketCategory } from '@models/catalog.model';
import { CatalogService } from '@services/catalog.service';

@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.scss'] // Si tu as un fichier de style dédié, sinon tu peux l'enlever
})
export class ProductForm implements OnInit, OnChanges {

  foodCategoryList = Object.values(FoodCategory);
  pharmacyCategoryList = Object.values(PharmacyCategory);
  supermarketCategoryList = Object.values(SupermarketCategory);
  // ⚡️ ENTRÉES (Fournies par le composant parent)
  @Input() productToEdit: any = null; // Si null = Création, si rempli = Modification
  @Input() stores: any[] = [];        // La liste des magasins pour le select

  // ⚡️ SORTIES (Événements envoyés au composant parent)
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  productForm!: FormGroup;
  selectedStoreCategory: string = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService
  ) {}

  // Permet de savoir facilement si on est en mode édition ou création
  get isEditMode(): boolean {
    return !!this.productToEdit && !!this.productToEdit.id;
  }

  ngOnInit(): void {
    this.initForm();
  }

  // ⚡️ Se déclenche chaque fois que le parent modifie @Input() productToEdit
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productToEdit'] && this.productForm) {
      if (this.isEditMode) {
        this.fillFormForEdit();
      } else {
        // Mode création : on remet à zéro
        this.productForm.reset({ available: true, basePrice: 0 });
        this.selectedStoreCategory = '';
      }
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      // Champs Communs
      name: ['', Validators.required],
      description: [''],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      storeId: ['', Validators.required],
      available: [true],
      imageURL: [''],
      vegetarian: [false],
      // Spécifique RESTAURANT
      ingredients: [''],
      foodCategories: [[]],

      // Spécifique PHARMACY
      activeIngredient: [''],
      pharmacyCategories: [[]],
      dosage: [''],
      requiresPrescription: [false],

      // Spécifique SUPERMARKET
      weightInKg: [0],
      supermarketCategories: [[]],

      // Spécifique SPECIAL_DELIVERY
      pricePerKm: [0],
      pricePerKg: [0],
      maxWeightKg: [0]
    });

    // Si le formulaire est initialisé alors qu'on a déjà reçu un produit à éditer
    if (this.isEditMode) {
      this.fillFormForEdit();
    }
  }

  // Remplit le formulaire avec les données du produit existant
  fillFormForEdit(): void {
    const product = this.productToEdit;
    
    // 1. Trouver la catégorie du magasin
    this.selectedStoreCategory = product.store?.category || this.getStoreCategory(product.storeId);

    // 2. Transformer le tableau d'ingrédients en texte (ex: ["Tomate", "Fromage"] -> "Tomate, Fromage")
    let displayIngredients = '';
    if (Array.isArray(product.ingredients)) {
      displayIngredients = product.ingredients.join(', ');
    }

    // 3. Remplir le formulaire
    this.productForm.patchValue({
      storeId: product.store?.id || product.storeId,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      available: product.available,
      imageURL: product.imageURL,
      
      foodCategories: Array.isArray(product.foodCategories) ? product.foodCategories : [],
      ingredients: displayIngredients,
      
      pharmacyCategories: Array.isArray(product.pharmacyCategories) ? product.pharmacyCategories : [],
      activeIngredient: product.activeIngredient,
      dosage: product.dosage,
      requiresPrescription: !!product.requiresPrescription,
      
      supermarketCategories: Array.isArray(product.supermarketCategories) ? product.supermarketCategories : [],
      weightInKg: product.weightInKg,
      
      pricePerKm: product.pricePerKm,
      pricePerKg: product.pricePerKg,
      maxWeightKg: product.maxWeightKg
    });
  }

  // Détecte le changement de magasin dans le select pour afficher les bons champs
  onStoreChange(event: any): void {
    const storeId = event.target.value;
    this.selectedStoreCategory = this.getStoreCategory(storeId);
  }

  getStoreCategory(storeId: string): string {
    const store = this.stores.find(s => s.id === storeId);
    return store ? store.category : '';
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formData = this.productForm.value;
    let apiCall$;

    // 1. FORMATAGE DES DONNÉES (Tableaux)
    switch (this.selectedStoreCategory) {
      case 'RESTAURANT':
        formData.foodCategories = Array.isArray(formData.foodCategories) ? formData.foodCategories : (formData.foodCategories ? [formData.foodCategories] : []);
        if (typeof formData.ingredients === 'string') {
          formData.ingredients = formData.ingredients.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0);
        } else if (!formData.ingredients) {
          formData.ingredients = [];
        }
        break;
      case 'PHARMACY':
        formData.pharmacyCategories = Array.isArray(formData.pharmacyCategories) ? formData.pharmacyCategories : (formData.pharmacyCategories ? [formData.pharmacyCategories] : []);
        break;
      case 'SUPERMARKET':
        formData.supermarketCategories = Array.isArray(formData.supermarketCategories) ? formData.supermarketCategories : (formData.supermarketCategories ? [formData.supermarketCategories] : []);
        break;
    }

    // 2. NETTOYAGE (On supprime les champs qui ne correspondent pas à la catégorie)
    const cleanData = { ...formData };
    cleanData.type = this.selectedStoreCategory;
    
    if (this.selectedStoreCategory !== 'RESTAURANT') {
      delete cleanData.ingredients;
      delete cleanData.foodCategories;
    }
    if (this.selectedStoreCategory !== 'PHARMACY') {
      delete cleanData.activeIngredient;
      delete cleanData.pharmacyCategories;
      delete cleanData.dosage;
      delete cleanData.requiresPrescription;
    }
    if (this.selectedStoreCategory !== 'SUPERMARKET') {
      delete cleanData.weightInKg;
      delete cleanData.supermarketCategories;
    }
    if (this.selectedStoreCategory !== 'SPECIAL_DELIVERY') {
      delete cleanData.pricePerKm;
      delete cleanData.pricePerKg;
      delete cleanData.maxWeightKg;
    }

    // 3. AIGUILLAGE API (Update ou Create)
    if (this.isEditMode) {
      apiCall$ = this.catalogService.updateOffer(this.productToEdit.id, cleanData);
    } else {
      switch (this.selectedStoreCategory) {
        case 'RESTAURANT': apiCall$ = this.catalogService.createRestaurantItem(cleanData); break;
        case 'PHARMACY': apiCall$ = this.catalogService.createPharmacyItem(cleanData); break;
        case 'SUPERMARKET': apiCall$ = this.catalogService.createSupermarketItem(cleanData); break;
        case 'SPECIAL_DELIVERY': apiCall$ = this.catalogService.createDeliveryService(cleanData); break;
        default: apiCall$ = this.catalogService.createOffer(cleanData); break;
      }
    }

    // 4. EXÉCUTION
    apiCall$.subscribe({
      next: (result) => {
        this.submitting = false;
        // On prévient le parent que la sauvegarde a réussi et on lui passe le résultat
        this.saved.emit(result); 
      },
      error: (err) => {
        console.error('Erreur lors de la sauvegarde:', err);
        const backendMessage = err.error?.message || err.error?.error || JSON.stringify(err.error);
        alert('Erreur Backend :\n' + backendMessage);
        this.submitting = false;
      }
    });
  }
  // --- À AJOUTER DANS LA CLASSE ProductFormComponent ---

  // Vérifie si la catégorie est déjà dans le tableau (pour cocher la case par défaut)
// Vérifie si la catégorie est cochée, en précisant le nom du champ
  isCategoryChecked(category: string, controlName: string): boolean {
    const currentCategories = this.productForm.get(controlName)?.value;
    return Array.isArray(currentCategories) && currentCategories.includes(category);
  }

  // Met à jour le bon FormControl quand on coche/décoche
  onCategoryChange(event: any, category: string, controlName: string): void {
    const isChecked = event.target.checked;
    let currentCategories = this.productForm.get(controlName)?.value;

    if (!Array.isArray(currentCategories)) {
      currentCategories = currentCategories ? [currentCategories] : [];
    }

    if (isChecked) {
      if (!currentCategories.includes(category)) {
        // L'utilisation de [controlName] permet de cibler le bon champ dynamiquement
        this.productForm.patchValue({
          [controlName]: [...currentCategories, category]
        });
      }
    } else {
      this.productForm.patchValue({
        [controlName]: currentCategories.filter((c: string) => c !== category)
      });
    }
  }
}