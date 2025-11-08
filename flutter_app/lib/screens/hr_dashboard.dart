import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HRDashboard extends StatefulWidget {
  @override
  _HRDashboardState createState() => _HRDashboardState();
}

class _HRDashboardState extends State<HRDashboard> {
  List<dynamic> users = [];
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadUsers();
  }

  Future<void> loadUsers() async {
    try {
      final data = await ApiService.getUsers();
      setState(() {
        users = data;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading users: $e')),
      );
    }
  }

  Future<void> addEmployee() async {
    if (_formKey.currentState!.validate()) {
      try {
        await ApiService.addUser(
          _usernameController.text,
          _passwordController.text,
          _nameController.text,
          _emailController.text,
        );
        
        _usernameController.clear();
        _passwordController.clear();
        _nameController.clear();
        _emailController.clear();
        
        loadUsers();
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Employee added successfully')),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error adding employee: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('HR Dashboard'),
        backgroundColor: Colors.green[800],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddEmployeeDialog(),
        child: Icon(Icons.add),
        backgroundColor: Colors.green[800],
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Employee Management', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: users.length,
                itemBuilder: (context, index) {
                  final user = users[index];
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: _getRoleColor(user['role']),
                        child: Text(user['name'][0]),
                      ),
                      title: Text(user['name']),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Username: ${user['username']}'),
                          Text('Role: ${user['role']}'),
                          Text('Email: ${user['email']}'),
                        ],
                      ),
                      isThreeLine: true,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'admin':
        return Colors.red;
      case 'hr':
        return Colors.green;
      case 'manager':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  void _showAddEmployeeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Add New Employee'),
        content: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _usernameController,
                decoration: InputDecoration(labelText: 'Username'),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: 'Full Name'),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Email'),
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: addEmployee,
            child: Text('Add'),
          ),
        ],
      ),
    );
  }
}