export type StoreData = {
  storeId: string;
  storeName: string;
  categories: Category[];
};

export type Category = {
  categoryId: string;
  categoryName: string;
  items: FoodItem[];
};

export type FoodItem = {
  id: string;
  name: string;
  price: number;
  image: any; //require()을 위함
  popularity: number;
};

export const dummyData: StoreData[] = [
  {
    storeId: 'store1',
    storeName: '킴스레시피 본점',
    categories: [
      {
        categoryId: 'cat1',
        categoryName: '즉석반찬',
        items: [
          { id: 'item1', name: '건파래무침', price: 4900, image: require('../assets/image1.jpg'), popularity: 120},
          { id: 'item2', name: '건두부무침', price: 4500, image: require('../assets/image2.jpg'), popularity: 80 },
          { id: 'item3', name: '건가지나물', price: 4500, image: require('../assets/image3.jpg'), popularity: 120 },
          { id: 'item4', name: '감자채볶음', price: 4500, image: require('../assets/image4.jpg'), popularity: 120 },
          { id: 'item5', name: '감자조림', price: 4500, image: require('../assets/image5.jpg'), popularity: 120 },
        ]
      },
      {
        categoryId: 'cat2',
        categoryName: '밑반찬',
        items: [
          { id: 'item6', name: '칠리건새우볶음', price: 5900, image: require('../assets/image6.jpg'), popularity: 120 },
          { id: 'item7', name: '건새우조림', price: 5900, image: require('../assets/image7.jpg'), popularity: 80 },
          { id: 'item8', name: '땡초꿀멸치', price: 5900, image: require('../assets/image8.jpg'), popularity: 120 },
          { id: 'item9', name: '아몬드멸치볶음', price: 5900, image: require('../assets/image9.jpg'), popularity: 120 },
          { id: 'item10', name: '고추장멸치', price: 5900, image: require('../assets/image10.jpg'), popularity: 120 },
          { id: 'item11', name: '소고기장조림+메추리알', price: 14900, image: require('../assets/image11.jpg'), popularity: 120 },
        ]
      }
    ]
  },
  {
    storeId: 'store2',
    storeName: '킴스레시피 2호점',
    categories: [
      {
        categoryId: 'cat2',
        categoryName: '밑반찬',
        items: [
          { id: 'item10', name: '고추장멸치', price: 5900, image: require('../assets/image10.jpg'), popularity: 120 },
          { id: 'item7', name: '건새우조림', price: 5900, image: require('../assets/image7.jpg'), popularity: 80 },
          { id: 'item6', name: '칠리건새우볶음', price: 5900, image: require('../assets/image6.jpg'), popularity: 120 },
        ]
      }
    ]
  }
];