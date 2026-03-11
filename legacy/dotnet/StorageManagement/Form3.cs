using System.Diagnostics;
using System.Windows.Forms;

namespace StorageManagement
{
    public partial class Form3 : Form
    {
        public Form3()
        {
            InitializeComponent();
        }

        private void linkLabel1_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
           
            var p = new Process();
            p.StartInfo = new ProcessStartInfo("http://creativecommons.org/licenses/by-nc-sa/4.0/")
            {
                UseShellExecute = true
            };
            p.Start();
        }
    }
}
