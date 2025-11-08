import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://attendance-system-complete.vercel.app/api';
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }
  
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }
  
  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }
  
  static Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> punchIn(double latitude, double longitude) async {
    final token = await getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/punch-in'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'latitude': latitude, 'longitude': longitude}),
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> punchOut(double latitude, double longitude) async {
    final token = await getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/punch-out'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'latitude': latitude, 'longitude': longitude}),
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<List<dynamic>> getAttendance(int userId) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/attendance/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<List<dynamic>> getNotifications(int userId) async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/notifications/$userId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<List<dynamic>> getAllAttendance() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/attendance'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<List<dynamic>> getUsers() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/users'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> getAnalytics() async {
    final token = await getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/analytics'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> addUser(String username, String password, String name, String email) async {
    final token = await getToken();
    final response = await http.post(
      Uri.parse('$baseUrl/users'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'username': username,
        'password': password,
        'name': name,
        'email': email,
      }),
    );
    
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> verifyOTP(int userId, String otp) async {
    final response = await http.post(
      Uri.parse('$baseUrl/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'userId': userId, 'otp': otp}),
    );
    
    return jsonDecode(response.body);
  }
}