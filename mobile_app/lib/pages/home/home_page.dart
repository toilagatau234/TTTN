import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../common/app_colors.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // Dữ liệu giả lập Banner
  final List<String> imgList = [
    'https://img.freepik.com/free-psd/horizontal-banner-template-flower-shop_23-2148906325.jpg',
    'https://img.freepik.com/free-vector/flat-valentines-day-sale-horizontal-banner-template_23-2149247346.jpg',
  ];

  // Dữ liệu giả lập Danh mục
  final List<Map<String, dynamic>> categories = [
    {'icon': Icons.local_florist, 'name': 'Hoa Hồng'},
    {'icon': Icons.filter_vintage, 'name': 'Hoa Lan'},
    {'icon': Icons.card_giftcard, 'name': 'Quà tặng'},
    {'icon': Icons.celebration, 'name': 'Sự kiện'},
  ];

  // Dữ liệu giả lập Sản phẩm
  final List<Map<String, dynamic>> products = [
    {'name': 'Bó Hoa Hồng Đỏ', 'price': '550.000đ', 'img': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?auto=format&fit=crop&w=100&q=80'},
    {'name': 'Lẵng Hoa Hướng Dương', 'price': '1.200.000đ', 'img': 'https://images.unsplash.com/photo-1597826368522-9f4a53586d0e?auto=format&fit=crop&w=100&q=80'},
    {'name': 'Hộp Hoa Tulip', 'price': '2.500.000đ', 'img': 'https://images.unsplash.com/photo-1588825838638-349f291350a4?auto=format&fit=crop&w=100&q=80'},
    {'name': 'Lan Hồ Điệp', 'price': '3.000.000đ', 'img': 'https://images.unsplash.com/photo-1566929369-1c255c5e0682?auto=format&fit=crop&w=100&q=80'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.secondary,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chào buổi sáng 👋', style: TextStyle(fontSize: 14, color: AppColors.grey)),
            Text('Nguyen Quoc Anh', style: TextStyle(fontSize: 18, color: AppColors.text, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.search, color: AppColors.text)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none, color: AppColors.text)),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            
            // --- 1. BANNER SLIDER ---
            CarouselSlider(
              options: CarouselOptions(
                height: 160.0,
                autoPlay: true,
                enlargeCenterPage: true,
                aspectRatio: 16 / 9,
                viewportFraction: 0.9,
              ),
              items: imgList.map((item) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 5.0),
                  child: ClipRRect(
                    borderRadius: const BorderRadius.all(Radius.circular(15.0)),
                    child: Image.network(item, fit: BoxFit.cover, width: 1000.0),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 25),

            // --- 2. DANH MỤC (CATEGORIES) ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: const Text('Danh mục', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text)),
            ),
            const SizedBox(height: 15),
            SizedBox(
              height: 90,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 10),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(15),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(15), boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 10)]),
                          child: Icon(categories[index]['icon'], color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(height: 8),
                        Text(categories[index]['name'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.text)),
                      ],
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            // --- 3. SẢN PHẨM NỔI BẬT (GRID) ---
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Sản phẩm nổi bật', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text)),
                  TextButton(onPressed: () {}, child: const Text('Xem tất cả', style: TextStyle(color: AppColors.primary))),
                ],
              ),
            ),
            
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 15,
                mainAxisSpacing: 15,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final item = products[index];
                return Container(
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                          child: Image.network(item['img'], fit: BoxFit.cover, width: double.infinity),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text(item['price'], style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}