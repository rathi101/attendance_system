import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AdminDashboard extends StatefulWidget {
  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  List<dynamic> users = [];
  List<dynamic> attendance = [];
  Map<String, dynamic> analytics = {};

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final usersData = await ApiService.getUsers();
      final attendanceData = await ApiService.getAllAttendance();
      final analyticsData = await ApiService.getAnalytics();
      
      setState(() {
        users = usersData;
        attendance = attendanceData;
        analytics = analyticsData;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading data: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Admin Dashboard'),
        backgroundColor: Colors.blue[800],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Analytics Cards
            Row(
              children: [
                Expanded(child: _buildAnalyticsCard('Total Employees', analytics['totalEmployees']?.toString() ?? '0', Icons.people)),
                SizedBox(width: 16),
                Expanded(child: _buildAnalyticsCard('Present Today', analytics['presentToday']?.toString() ?? '0', Icons.check_circle)),
              ],
            ),
            SizedBox(height: 16),
            
            // Users List
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Employees', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(height: 16),
                    ...users.map((user) => ListTile(
                      leading: CircleAvatar(child: Text(user['name'][0])),
                      title: Text(user['name']),
                      subtitle: Text('${user['role']} - ${user['username']}'),
                      trailing: Icon(Icons.arrow_forward_ios),
                    )).toList(),
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 16),
            
            // Recent Attendance
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Recent Attendance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(height: 16),
                    ...attendance.take(5).map((record) => ListTile(
                      title: Text(record['userName'] ?? 'Unknown'),
                      subtitle: Text('${record['date']} - ${record['status']}'),
                      trailing: _getStatusIcon(record['status']),
                    )).toList(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsCard(String title, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: Colors.blue[800]),
            SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(title, style: TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icon(Icons.check_circle, color: Colors.green);
      case 'half_day':
        return Icon(Icons.schedule, color: Colors.orange);
      case 'absent':
        return Icon(Icons.cancel, color: Colors.red);
      default:
        return Icon(Icons.help, color: Colors.grey);
    }
  }
}