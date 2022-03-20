using System;
using System.Windows.Forms;

namespace StorageManagement
{
    public partial class Form2 : Form
    {
        public string L1 { get; set; }
        public string L2 { get; set; }
        public string L3 { get; set; }
        public string L4 { get; set; }


        public Form2(int a)
        {
            InitializeComponent();
            this.CancelButton = button2;
            textBox4.Text = "" + a;
        }

        public Form2(int a, string b, string c, int d)
        {
            InitializeComponent();
            this.CancelButton = button2;
            textBox4.Text = "" + a;
            textBox3.Text = "" + b;
            textBox2.Text = "" + c;
            numericUpDown1.Value = d;
        }

        private void button1_Click(object sender, EventArgs e)
        {
            this.L1 = textBox4.Text;
            this.L2 = textBox3.Text;
            this.L3 = textBox2.Text;
            this.L4 = ""+numericUpDown1.Value;

            if(this.L1!="" && this.L2 != "" && this.L3 != "" && this.L4 != "") { 
            this.DialogResult = DialogResult.OK;
            this.Close();
            }
            else
            {
                MessageBox.Show("Παρακαλώ συμπληρώστε όλα τα πεδία");
            }
        }
    }
}
