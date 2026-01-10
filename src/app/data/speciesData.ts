import { Species } from "../components/SpeciesCard";

export const speciesData: Species[] = [
  // Animales
  {
    id: "1",
    name: "Tigre de Bengala",
    scientificName: "Panthera tigris tigris",
    status: "peligro",
    habitat: "Bosque",
    region: "Asia",
    population: "<2,500",
    imageUrl:
      "https://images.unsplash.com/photo-1759346673950-c24e611680c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWdlciUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },
  {
    id: "2",
    name: "Oso Panda Gigante",
    scientificName: "Ailuropoda melanoleuca",
    status: "vulnerable",
    habitat: "Bosque",
    region: "Asia",
    population: "~1,864",
    imageUrl:
      "https://images.unsplash.com/photo-1723444612558-a41b25c8e896?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYW5kYSUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },
  {
    id: "3",
    name: "Elefante Africano",
    scientificName: "Loxodonta africana",
    status: "peligro",
    habitat: "Desierto",
    region: "África",
    population: "~415,000",
    imageUrl:
      "https://images.unsplash.com/photo-1670384628277-98c0a5f14a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVwaGFudCUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },
  {
    id: "4",
    name: "Gorila de Montaña",
    scientificName: "Gorilla beringei beringei",
    status: "critico",
    habitat: "Montaña",
    region: "África",
    population: "~1,063",
    imageUrl:
      "https://images.unsplash.com/photo-1762358511314-ac38f03cffbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3JpbGxhJTIwZW5kYW5nZXJlZCUyMGFuaW1hbHxlbnwxfHx8fDE3NjgwNzEzOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },
  {
    id: "5",
    name: "Tortuga Marina",
    scientificName: "Cheloniidae",
    status: "critico",
    habitat: "Marino",
    region: "Oceanía",
    population: "<25,000",
    imageUrl:
      "https://images.unsplash.com/photo-1761365175714-73ac857fc43a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWElMjB0dXJ0bGUlMjBlbmRhbmdlcmVkfGVufDF8fHx8MTc2ODA3MTM5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },
  {
    id: "6",
    name: "Rinoceronte de Java",
    scientificName: "Rhinoceros sondaicus",
    status: "critico",
    habitat: "Bosque",
    region: "Asia",
    population: "<75",
    imageUrl:
      "https://images.unsplash.com/photo-1670384628277-98c0a5f14a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVwaGFudCUyMGVuZGFuZ2VyZWQlMjBhbmltYWx8ZW58MXx8fHwxNzY4MDcxMzkyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "animal",
  },

  // Plantas
  {
    id: "7",
    name: "Orquídea de Madagascar",
    scientificName: "Angraecum sesquipedale",
    status: "peligro",
    habitat: "Tropical",
    region: "África",
    population: "<10,000",
    imageUrl:
      "https://images.unsplash.com/photo-1691221675329-699e45f47785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmNoaWQlMjBlbmRhbmdlcmVkJTIwZmxvd2VyfGVufDF8fHx8MTc2ODA3MTM5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },
  {
    id: "8",
    name: "Cactus Barril Dorado",
    scientificName: "Echinocactus grusonii",
    status: "vulnerable",
    habitat: "Desértico",
    region: "América",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1581573429747-42f947a4e178?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWN0dXMlMjByYXJlJTIwcGxhbnR8ZW58MXx8fHwxNzY4MDcxMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },
  {
    id: "9",
    name: "Dionea Atrapamoscas",
    scientificName: "Dionaea muscipula",
    status: "vulnerable",
    habitat: "Acuático",
    region: "América",
    population: "<50,000",
    imageUrl:
      "https://images.unsplash.com/photo-1692205413648-791a8056fe87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZW51cyUyMGZseXRyYXAlMjBwbGFudHxlbnwxfHx8fDE3NjgwNzEzOTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },
  {
    id: "10",
    name: "Baobab de Grandidier",
    scientificName: "Adansonia grandidieri",
    status: "peligro",
    habitat: "Tropical",
    region: "África",
    population: "<10,000",
    imageUrl:
      "https://images.unsplash.com/photo-1574261431492-59cd1103400b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW9iYWIlMjB0cmVlJTIwcmFyZXxlbnwxfHx8fDE3NjgwNzEzOTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },
  {
    id: "11",
    name: "Welwitschia",
    scientificName: "Welwitschia mirabilis",
    status: "vulnerable",
    habitat: "Desértico",
    region: "África",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1581573429747-42f947a4e178?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWN0dXMlMjByYXJlJTIwcGxhbnR8ZW58MXx8fHwxNzY4MDcxMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },
  {
    id: "12",
    name: "Cycas Revoluta",
    scientificName: "Cycas revoluta",
    status: "peligro",
    habitat: "Templado",
    region: "Asia",
    population: "<5,000",
    imageUrl:
      "https://images.unsplash.com/photo-1691221675329-699e45f47785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmNoaWQlMjBlbmRhbmdlcmVkJTIwZmxvd2VyfGVufDF8fHx8MTc2ODA3MTM5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "planta",
  },

  // Hongos
  {
    id: "13",
    name: "Hongo Portobello Silvestre",
    scientificName: "Agaricus bisporus",
    status: "vulnerable",
    habitat: "Bosque",
    region: "Europa",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1663639681732-ed83fe086a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNocm9vbSUyMGZ1bmd1cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjgwNzEzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
  {
    id: "14",
    name: "Matsutake",
    scientificName: "Tricholoma matsutake",
    status: "critico",
    habitat: "Bosque",
    region: "Asia",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1691913118667-119fd2a33a94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXJlJTIwbXVzaHJvb20lMjBmb3Jlc3R8ZW58MXx8fHwxNzY4MDcxMzk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
  {
    id: "15",
    name: "Trufa Blanca",
    scientificName: "Tuber magnatum",
    status: "peligro",
    habitat: "Bosque",
    region: "Europa",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1747130263102-cf8ff7e2cc10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVmZmxlJTIwbXVzaHJvb20lMjByYXJlfGVufDF8fHx8MTc2ODA3MTM5NXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
  {
    id: "16",
    name: "Cantharellus californicus",
    scientificName: "Cantharellus californicus",
    status: "vulnerable",
    habitat: "Bosque",
    region: "América",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1663639681732-ed83fe086a4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNocm9vbSUyMGZ1bmd1cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjgwNzEzOTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
  {
    id: "17",
    name: "Hongo Coral",
    scientificName: "Ramaria botrytis",
    status: "vulnerable",
    habitat: "Pradera",
    region: "Europa",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1691913118667-119fd2a33a94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXJlJTIwbXVzaHJvb20lMjBmb3Jlc3R8ZW58MXx8fHwxNzY4MDcxMzk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
  {
    id: "18",
    name: "Boleto del Diablo",
    scientificName: "Rubroboletus satanas",
    status: "peligro",
    habitat: "Montaña",
    region: "Europa",
    population: "Desconocido",
    imageUrl:
      "https://images.unsplash.com/photo-1747130263102-cf8ff7e2cc10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVmZmxlJTIwbXVzaHJvb20lMjByYXJlfGVufDF8fHx8MTc2ODA3MTM5NXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "hongo",
  },
];
