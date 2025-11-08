import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ManagerDashboard extends StatefulWidget {
  @override
  _ManagerDashboardState createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  List<dynamic> attendance = [];
  Map<String, dynamic> analytics = {};

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      final attendanceData = await ApiService.getAllAttendance();
      final analyticsData = await ApiService.getAnalytics();
      
      setState(() {
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
        title: Text('Manager Dashboard'),
        backgroundColor: Colors.purple[800],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Team Analytics
            Text('Team Overview', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(child: _buildAnalyticsCard('Team Size', analytics['totalEmployees']?.toString() ?? '0', Icons.group)),
                SizedBox(width: 16),
                Expanded(child: _buildAnalyticsCard('Present Today', analytics['presentToday']?.toString() ?? '0', Icons.check_circle)),
              ],
            ),
            
            SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(child: _buildAnalyticsCard('Avg Hours', analytics['avgWorkingHours']?.toString() ?? '0', Icons.schedule)),
                SizedBox(width: 16),
                Expanded(child: _buildAnalyticsCard('Total Records', analytics['totalAttendanceRecords']?.toString() ?? '0', Icons.assignment)),
              ],
            ),
            
            SizedBox(height: 24),
            
            // Attendance Status
            Text('Team Attendance', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            
            Card(
              child: Column(
                children: [
                  // Status Summary
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatusCount('Present', _getStatusCount('present'), Colors.green),
                        _buildStatusCount('Half Day', _getStatusCount('half_day'), Colors.orange),
                        _buildStatusCount('Absent', _getStatusCount('absent'), Colors.red),
                      ],
                    ),
                  ),
                  Divider(),
                  
                  // Attendance List
                  ...attendance.take(10).map((record) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(record['status']),
                      child: Icon(Icons.person, color: Colors.white),
                    ),
                    title: Text(record['userName'] ?? 'Unknown'),
                    subtitle: Text('${record['date']} - ${_formatTime(record['punchIn'])}'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(record['status'].toUpperCase(), 
                             style: TextStyle(fontWeight: FontWeight.bold, color: _getStatusColor(record['status']))),
                        if (record['workingHours'] != null)
                          Text('${record['workingHours']}h', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  )).toList(),
                ],
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
            Icon(icon, size: 32, color: Colors.purple[800]),
            SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(title, style: TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCount(String label, int count, Color color) {
    return Column(
      children: [
        Text(count.toString(), style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 12)),
      ],
    );
  }

  int _getStatusCount(String status) {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return attendance.where((record) => record['date'] == today && record['status'] == status).length;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'half_day':
        return Colors.orange;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    final time = DateTime.parse(timestamp);
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}