import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DioClient {
  // Dùng 10.0.2.2 cho Android Emulator, localhost cho iOS Simulator
  static const String baseUrl = 'http://10.0.2.2:5000/api'; 

  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  DioClient() {
    // Tự động gắn Token vào mỗi request nếu đã đăng nhập
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("API Error: ${e.response?.data}");
        return handler.next(e);
      },
    ));
  }

  Dio get api => _dio;
}